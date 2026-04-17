const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const admin = require('firebase-admin');

const db = admin.firestore();

// Initialize Twilio client
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER;
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP_NUMBER; // Shop owner's WhatsApp

// Helper: Format phone number to international format
function formatPhone(phone) {
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('whatsapp:')) clean = clean.replace('whatsapp:', '');
    if (!clean.startsWith('+')) clean = `+91${clean}`;
    return clean;
}

// Helper: Store a message in Firestore
async function storeMessage({ from, to, body, direction, supplierPhone, supplierName, productName }) {
    const msg = {
        from,
        to,
        body,
        direction,
        supplierPhone: formatPhone(supplierPhone || from),
        supplierName: supplierName || null,
        productName: productName || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('whatsapp_messages').add(msg);
}

// Helper: Get the last active supplier for the owner (for reply routing)
async function getLastActiveSupplier() {
    // Simple query — no composite index needed
    const snapshot = await db.collection('whatsapp_messages')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();

    if (snapshot.empty) return null;
    
    // Find the most recent outbound message in memory
    const outbound = snapshot.docs.find(doc => doc.data().direction === 'outbound');
    if (!outbound) return null;
    
    const lastMsg = outbound.data();
    return {
        phone: lastMsg.supplierPhone,
        name: lastMsg.supplierName
    };
}

// Helper: Get the last outbound message TO a specific supplier (for context)
async function getLastOutboundForSupplier(supplierPhone) {
    const cleanPhone = formatPhone(supplierPhone);
    const snapshot = await db.collection('whatsapp_messages')
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();

    if (snapshot.empty) return null;
    
    const outbound = snapshot.docs.find(doc => {
        const d = doc.data();
        // Skip messages that don't have a product name (like quick echo replies)
        return d.direction === 'outbound' && d.supplierPhone === cleanPhone && d.productName;
    });
    
    return outbound ? outbound.data() : null;
}

// Helper: Basic intent matching (checks if text contains confirmation keywords)
function isConfirmation(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    const keywords = ['yes', 'ok', 'confirm', 'available', 'done', 'will send', 'sure', 'rs', 'price', 'in stock'];
    // Return true if any affirmative keyword is found
    return keywords.some(kw => lower.includes(kw));
}

// Helper: Look up supplier name from vendors collection by phone
async function lookupSupplierByPhone(phone) {
    const cleanPhone = formatPhone(phone);
    const snapshot = await db.collection('vendors').get();
    const vendor = snapshot.docs.find(doc => {
        const data = doc.data();
        if (!data.contact) return false;
        return formatPhone(data.contact) === cleanPhone;
    });
    return vendor ? vendor.data() : null;
}

// ─── POST: Send WhatsApp message to a supplier (from Inventory UI) ───
router.post('/contact-supplier', async (req, res) => {
    try {
        const { supplierName, supplierPhone, productName, currentStock, message } = req.body;

        if (!supplierPhone || !productName) {
            return res.status(400).json({ error: 'Supplier phone and product name are required' });
        }

        const cleanPhone = formatPhone(supplierPhone);
        const toNumber = `whatsapp:${cleanPhone}`;

        const messageBody = message ||
            `Hi ${supplierName || 'Supplier'},\n\nThis is *Smart Vyapar*.\n\nWe're running low on *${productName}* (current stock: ${currentStock ?? 'N/A'} units).\n\nDo you have this product in stock? Please let us know availability and pricing at the earliest.\n\nThank you! 🙏`;

        // Send via Twilio
        const twilioMessage = await client.messages.create({
            body: messageBody,
            from: TWILIO_WHATSAPP_FROM,
            to: toNumber
        });

        // Store outbound message
        await storeMessage({
            from: TWILIO_WHATSAPP_FROM,
            to: toNumber,
            body: messageBody,
            direction: 'outbound',
            supplierPhone,
            supplierName,
            productName
        });

        // Also notify the owner on WhatsApp that the message was sent
        if (OWNER_WHATSAPP) {
            const ownerTo = `whatsapp:${formatPhone(OWNER_WHATSAPP)}`;
            await client.messages.create({
                body: `📤 *Sent to ${supplierName || cleanPhone}:*\n\n${messageBody}`,
                from: TWILIO_WHATSAPP_FROM,
                to: ownerTo
            });
        }

        res.status(200).json({
            success: true,
            messageSid: twilioMessage.sid,
            status: twilioMessage.status,
            message: `WhatsApp message sent to ${supplierName || supplierPhone}`
        });

    } catch (error) {
        console.error('Twilio WhatsApp Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to send WhatsApp message',
            details: error.message
        });
    }
});

// ─── POST: Twilio Webhook — WhatsApp relay between owner & supplier ───
router.post('/webhook', async (req, res) => {
    try {
        const { From, To, Body, ProfileName } = req.body;
        const senderPhone = formatPhone(From);
        const ownerPhone = OWNER_WHATSAPP ? formatPhone(OWNER_WHATSAPP) : null;

        console.log(`📩 WhatsApp from ${ProfileName || senderPhone}: ${Body}`);

        // Determine if this message is from the OWNER or a SUPPLIER
        // TEMPORARY FIX: Force isFromOwner to false so that messages from the owner's phone 
        // are treated as supplier replies (to test the order creation flow)
        const isFromOwner = ownerPhone && senderPhone === ownerPhone;

        if (isFromOwner) {
            // ── OWNER is replying → forward to the last active supplier ──
            const lastSupplier = await getLastActiveSupplier();

            if (!lastSupplier) {
                // No active conversation, notify owner
                await client.messages.create({
                    body: `⚠️ No active supplier conversation found. Please initiate a conversation from the Smart Vyapar app first.`,
                    from: TWILIO_WHATSAPP_FROM,
                    to: `whatsapp:${ownerPhone}`
                });
            } else {
                // Forward owner's message to the supplier
                const supplierTo = `whatsapp:${formatPhone(lastSupplier.phone)}`;
                await client.messages.create({
                    body: Body,
                    from: TWILIO_WHATSAPP_FROM,
                    to: supplierTo
                });

                // Store the outbound message
                await storeMessage({
                    from: TWILIO_WHATSAPP_FROM,
                    to: supplierTo,
                    body: Body,
                    direction: 'outbound',
                    supplierPhone: lastSupplier.phone,
                    supplierName: lastSupplier.name
                });

                console.log(`➡️ Forwarded owner reply to ${lastSupplier.name || lastSupplier.phone}`);
            }

        } else {
            // ── SUPPLIER is replying → analyze and process order ──
            const supplier = await lookupSupplierByPhone(senderPhone);
            const supplierName = supplier?.name || ProfileName || senderPhone;

            // Store inbound message
            await storeMessage({
                from: From,
                to: To,
                body: Body,
                direction: 'inbound',
                supplierPhone: senderPhone,
                supplierName: supplierName
            });

            // Get context (what product were we asking about?)
            const lastOutbound = await getLastOutboundForSupplier(senderPhone);
            const productName = lastOutbound?.productName || 'Unknown Product';

            let ownerNotification = `📩 *Message from ${supplierName}:*\n\n${Body}`;

            // Check if this is an order confirmation
            if (isConfirmation(Body)) {
                // 1. Automatically create order
                await db.collection('orders').add({
                    status: 'CONFIRMED (via WhatsApp)',
                    supplier: supplierName,
                    product: productName,
                    notes: `Supplier replied: "${Body}"`,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

                ownerNotification = `✅ *Auto-Order Confirmed!*\n\nSupplier: ${supplierName}\nProduct: ${productName}\nReply: "${Body}"\n\n_This has been added to your Orders page._`;

                // 2. Send instant acknowledgement to supplier
                await client.messages.create({
                    body: `Thanks ${supplierName}! We have confirmed your availability for ${productName}. We'll contact you if further action is needed.`,
                    from: TWILIO_WHATSAPP_FROM,
                    to: From
                });
            }

            // Forward notification to the owner's WhatsApp
            if (ownerPhone) {
                await client.messages.create({
                    body: ownerNotification,
                    from: TWILIO_WHATSAPP_FROM,
                    to: `whatsapp:${ownerPhone}`
                });
                console.log(`➡️ Processed supplier message and notified owner`);
            }
        }

        // Respond with empty TwiML
        res.set('Content-Type', 'text/xml');
        res.send('<Response></Response>');

    } catch (error) {
        console.error('Webhook Error:', error.message);
        res.set('Content-Type', 'text/xml');
        res.send('<Response></Response>');
    }
});

module.exports = router;

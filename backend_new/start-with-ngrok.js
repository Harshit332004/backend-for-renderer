/**
 * Start the backend server with ngrok tunnel for Twilio webhooks.
 * 
 * Usage: node start-with-ngrok.js
 * 
 * This will:
 * 1. Start the Express server on port 5001
 * 2. Create an ngrok tunnel to expose it publicly
 * 3. Print the webhook URL to configure in Twilio Console
 */

require('dotenv').config();
const ngrok = require('ngrok');

const PORT = process.env.PORT || 5001;

async function startTunnel() {
    try {
        // Start ngrok tunnel
        const url = await ngrok.connect(PORT);
        const webhookUrl = `${url}/api/whatsapp/webhook`;

        console.log('\n' + '='.repeat(60));
        console.log('🚀 ngrok tunnel is live!');
        console.log('='.repeat(60));
        console.log(`\n📡 Public URL: ${url}`);
        console.log(`\n🔗 Twilio Webhook URL (copy this):\n`);
        console.log(`   ${webhookUrl}`);
        console.log(`\n📋 Steps to configure Twilio:`);
        console.log(`   1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn`);
        console.log(`   2. In "Sandbox Configuration", set:`);
        console.log(`      "WHEN A MESSAGE COMES IN" → ${webhookUrl}`);
        console.log(`      Method: POST`);
        console.log(`   3. Click Save`);
        console.log('\n' + '='.repeat(60) + '\n');

    } catch (error) {
        console.error('Failed to start ngrok:', error.message);
        console.log('\nTip: If you see an auth error, run:');
        console.log('  npx ngrok authtoken YOUR_NGROK_AUTH_TOKEN');
        process.exit(1);
    }
}

// Start the Express server first, then ngrok
require('./server');

// Give server a moment to start, then open tunnel
setTimeout(startTunnel, 1000);

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// GET all vendors
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('vendors').get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(items);
    } catch (error) {
        console.error("Firestore error:", error);
        res.status(500).json({ error: "Failed to fetch vendors", details: error.message });
    }
});

// POST new vendor (Merged Version)
router.post('/', async (req, res) => {
    try {
        // Extracted both 'rating' (from main) and Mehul's new fields
        const { name, location, rating, reliability, contact, products, leadTimeDays, price_per_unit, notes } = req.body;
        if (!name || !location) return res.status(400).json({ error: "Missing fields" });

        // Include both rating and reliability to ensure compatibility with both frontends
        const newVendor = { 
            name, 
            location, 
            rating: Number(rating) || 0,
            reliability: Number(reliability) || 0 
        };
        
        // Mehul's added logic for handling the new AI agent data
        if (contact) newVendor.contact = contact;
        if (products) {
            // Accept comma-separated string or array
            newVendor.products = Array.isArray(products) 
                ? products 
                : products.split(',').map(p => p.trim().toLowerCase());
        }
        if (leadTimeDays) newVendor.leadTimeDays = leadTimeDays;
        if (price_per_unit) newVendor.price_per_unit = Number(price_per_unit);
        if (notes) newVendor.notes = notes;

        const docRef = await db.collection('vendors').add(newVendor);
        res.status(201).json({ id: docRef.id, ...newVendor });
    } catch (error) {
        res.status(500).json({ error: "Failed to add vendor" });
    }
});

// PUT update vendor
router.put('/:id', async (req, res) => {
    try {
        await db.collection('vendors').doc(req.params.id).update(req.body);
        res.status(200).json({ message: "Vendor updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update vendor" });
    }
});

// DELETE vendor
router.delete('/:id', async (req, res) => {
    try {
        await db.collection('vendors').doc(req.params.id).delete();
        res.status(200).json({ message: "Vendor deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete vendor" });
    }
});

module.exports = router;
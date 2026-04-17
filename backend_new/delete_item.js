const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteNanesh() {
    const collections = ['inventory', 'products', 'vendors'];
    
    for (const coll of collections) {
        const snapshot = await db.collection(coll).get();
        for (const doc of snapshot.docs) {
            const data = doc.data();
            let hasMatch = false;
            
            for (const key in data) {
                if (typeof data[key] === 'string' && data[key].toLowerCase().includes('nanesh')) {
                    hasMatch = true;
                    break;
                }
            }
            
            if (hasMatch) {
                console.log(`Found in collection ${coll}, doc ${doc.id}:`, data);
                await db.collection(coll).doc(doc.id).delete();
                console.log('Deleted.');
            }
        }
    }
    console.log("Done");
}

deleteNanesh().catch(console.error);

import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate('./serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def delete_nanesh():
    collections = ['inventory', 'products', 'vendors', 'orders', 'customer_sales', 'pricing', 'whatsapp_messages']
    
    for coll in collections:
        docs = db.collection(coll).stream()
        for doc in docs:
            data = doc.to_dict()
            if not data:
                continue
                
            has_match = False
            for k, v in data.items():
                if isinstance(v, str) and 'nanesh' in v.lower():
                    has_match = True
                    break
            
            if has_match:
                print(f"Found nanesh in collection '{coll}', doc '{doc.id}'")
                db.collection(coll).document(doc.id).delete()
                print("Deleted.")

if __name__ == "__main__":
    delete_nanesh()
    print("Done deleting from Firestore")

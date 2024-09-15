import firebase_admin
from firebase_admin import credentials, firestore

# Path to your service account key JSON file
cred = credentials.Certificate("serviceAccountKey.json")

# Initialize the Firebase Admin SDK with the credentials
firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

# Store random data in Firestore
def store_random_data():
    try:
        # Reference to a collection and document
        doc_ref = db.collection('test_collection').document('random_doc')

        # Random data to store
        random_data = {
            'name': 'Test User',
            'age': 42,
            'location': 'Earth',
            'verified': True
        }

        # Set data in Firestore
        doc_ref.set(random_data)
        print("Random data has been stored successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")

# Fetch the stored data to verify the connection
def fetch_data():
    try:
        # Reference to the document
        doc_ref = db.collection('test_collection').document('random_doc')

        # Get the document
        doc = doc_ref.get()

        if doc.exists:
            print(f"Document data: {doc.to_dict()}")
        else:
            print("No such document found!")

    except Exception as e:
        print(f"An error occurred: {e}")




import uuid
from flask import Flask, jsonify, request
import os
from groq import Groq
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, storage
import base64

# Load environment variables from a .env file
load_dotenv()

# Initialize Firestore
# Initialize Firestore with the storage bucket name
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'firstimpressions-7ec44.appspot.com'
})

db = firestore.client()

# Initialize Flask app
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/process', methods=['POST'])
def process_image():
    print("Processing started...")
    if 'file' not in request.files:
        print("No file part in request.")
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        print("No file selected.")
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        try:
            # Read file contents
            file_contents = file.read()

            # Debug: Print file size to verify that file has been received
            print(f"File received. Size: {len(file_contents)} bytes")

            # Initialize the Groq client using the API key from the environment variables
            groq_api_key = os.getenv('GROQ_API_KEY')
            if not groq_api_key:
                print("Error: GROQ_API_KEY not found in environment variables.")
                return jsonify({'error': 'API key missing'}), 500

            client = Groq(api_key=groq_api_key)
            print("Groq client initialized successfully.")

            try:
                # Call Groq's API with the base64-encoded image and the model "llava-v1.5-7b-4096-preview"
                print("Sending request to Groq API with model 'llava-v1.5-7b-4096-preview'...")

                base64_image = base64.b64encode(file_contents).decode('utf-8')
                chat_completion = client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Describe this person with as many details as possible."},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}",  # Base64-encoded image
                                    },
                                },
                            ],
                        }
                    ],
                    model="llava-v1.5-7b-4096-preview",
                )

                # Debug: Print the full response from Groq API
                print("Groq API Response:", chat_completion)

                # Extract the description from the Groq API response
                description = chat_completion.choices[0].message.content

                print("Extracted description:", description)
                unique_filename = f"{uuid.uuid4()}{file.filename}"

                # Upload the image to Firebase Storage
                try:
                    bucket = storage.bucket()
                    blob = bucket.blob(f"images/{unique_filename}")
                    blob.upload_from_string(file_contents, content_type=file.content_type)
                    blob.make_public()  # Optional: Make the file public

                    # Get the image URL
                    image_url = blob.public_url

                    print(f"Image uploaded to Firebase Storage. URL: {image_url}")

                except Exception as storage_error:
                    print(f"Error uploading image to Firebase Storage: {str(storage_error)}")
                    return jsonify({'error': 'Error uploading image to Firebase Storage'}), 500

                # Store the description and image URL in Firestore
                try:
                    doc_ref = db.collection('processed_images').add({
                        'id': request.form.get('id'),
                        'description': description,
                        'image_url': image_url,
                        'filename': file.filename
                    })
                    print(f"Document stored in Firestore with ID: {doc_ref[1].id}")

                except Exception as firestore_error:
                    print(f"Error storing data in Firestore: {str(firestore_error)}")
                    return jsonify({'error': 'Error storing data in Firestore'}), 500

                # Return the description and image URL as a response
                return jsonify({'message': 'File uploaded successfully', 'description': description, 'image_url': image_url}), 200

            except Exception as api_error:
                print(f"Error calling Groq API: {str(api_error)}")
                return jsonify({'error': f'Error processing the image with Groq API: {str(api_error)}'}), 500

        except Exception as e:
            print(f"Error processing the file: {str(e)}")
            return jsonify({'error': f'Error processing the file: {str(e)}'}), 500

    print("Invalid file format.")
    return jsonify({'error': 'Invalid file format'}), 400




def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    is_allowed = '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    print(f"File '{filename}' allowed: {is_allowed}")
    return is_allowed

if __name__ == '__main__':
    app.run(debug=True)

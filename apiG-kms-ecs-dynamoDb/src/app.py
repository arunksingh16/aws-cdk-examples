# app.py

from flask import Flask, request, jsonify
import boto3
from base64 import b64encode, b64decode
from botocore.exceptions import ClientError
import os
import time

app = Flask(__name__)

# Get environment variables
KEY_ID = os.environ.get('KMS_KEY_ID')
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')

# Initialize boto3 client for KMS and DynamoDB
kms_client = boto3.client('kms')
dynamodb_resource = boto3.resource('dynamodb')
dynamodb_table = dynamodb_resource.Table(DYNAMODB_TABLE_NAME)

def check_connection_and_region():
    """
    Checks if a connection to DynamoDB is successful and prints the region.
    """
    try:
        dynamodb_resource.tables.all()
        print("Connection to DynamoDB successful!")
    except ClientError as e:
        print(f"Error connecting to DynamoDB: {e}")

# Check connection and region
check_connection_and_region()

print(f"KMS Key ID: {KEY_ID}")
print(f"DynamoDB Table Name: {DYNAMODB_TABLE_NAME}")

@app.route('/encrypt', methods=['POST'])
def encrypt():
    try:
        # The data that you want to encrypt
        plaintext = request.json['data']
        id_value = request.json['id']

        # Encrypt the data
        response = kms_client.encrypt(
            KeyId=KEY_ID,
            Plaintext=plaintext,
            EncryptionAlgorithm='SYMMETRIC_DEFAULT'
        )

        # The encrypted data is in the 'CiphertextBlob' field
        ciphertext = b64encode(response['CiphertextBlob']).decode()
        # Define the TTL in seconds (e.g., 7 days from now)
        ttl_duration = 7 * 24 * 60 * 60
        ttl_timestamp = int(time.time()) + ttl_duration
        # Store the encrypted data in DynamoDB
        dynamodb_table.put_item(
            Item={
                'id': id_value,
                'data': ciphertext,
                'ttl': ttl_timestamp  # TTL attribute
            }
        )
        return jsonify({'message': 'Data encrypted and stored successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/decrypt', methods=['GET'])
def decrypt():
    try:
        id_value = request.args.get('id')

        # Retrieve the encrypted data from DynamoDB
        response = dynamodb_table.get_item(
            Key={
                'id': id_value
            }
        )
        if 'Item' not in response:
            return jsonify({'error': 'Item not found'}), 404

        ciphertext = response['Item']['data']

        # Decrypt the data
        response = kms_client.decrypt(
            CiphertextBlob=b64decode(ciphertext),
            KeyId=KEY_ID,
            EncryptionAlgorithm='SYMMETRIC_DEFAULT'
        )

        # The decrypted data is in the 'Plaintext' field
        decrypted_text = response['Plaintext'].decode()

        return jsonify({'data': decrypted_text}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'message': 'Health is fine'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8888)

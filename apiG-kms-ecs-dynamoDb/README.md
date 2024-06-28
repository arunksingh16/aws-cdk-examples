# Use Case: CDK stack to build API 

This stack deploys a Python Flask API using Docker containers managed by AWS ECS.

- Frontend: The API is publicly accessible via API Gateway.
- Backend: A private Application Load Balancer (ALB) distributes traffic to ECS tasks running the Flask application.
- Functionality:
  - The API accepts string encryption requests at the /encrypt endpoint.
  - It utilizes AWS Key Management Service (KMS) for secure encryption.
  - Encrypted data is stored in DynamoDB with Time-To-Live (TTL) enabled for automatic expiration.

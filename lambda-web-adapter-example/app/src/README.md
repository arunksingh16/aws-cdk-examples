# Express.js Application for AWS Lambda Web Adapter

This directory contains a simple Express.js application configured to run with AWS Lambda Web Adapter.

## Express Application

The application serves a basic "Hi there!" message through an Express.js server.

## Installation

```bash
# Install dependencies
npm install
```

## Development Dependencies

For TypeScript development, install these dependencies:

```bash
# Install TypeScript development dependencies
npm install typescript --save-dev
npx tsc --init
npm install --save @types/express
npm install --save ts-node
npm install --save @types/aws-lambda
```

## Running Locally

```bash
# Run the Express server locally
node index.js
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## SIGTERM Handler

The application includes a SIGTERM handler for proper cleanup when running in AWS Lambda:

```javascript
// SIGTERM Handler
process.on('SIGTERM', async () => {
    console.info('[express] SIGTERM received');
    console.info('[express] cleaning up');
    // perform actual clean up work here.
    await new Promise(resolve => setTimeout(resolve, 100));
    console.info('[express] exiting');
    process.exit(0)
});
```

## Container Deployment

The parent directory contains a Dockerfile that:

1. Uses a Node.js base image
2. Installs the AWS Lambda Web Adapter
3. Sets the proper execution permissions
4. Copies and installs the application
5. Sets the application as the container command

## Environment Variables

- `PORT`: Controls the port the application listens on (default: 3000)

When deployed to Lambda, the AWS_LAMBDA_EXEC_WRAPPER environment variable will be set to point to the Lambda Web Adapter.
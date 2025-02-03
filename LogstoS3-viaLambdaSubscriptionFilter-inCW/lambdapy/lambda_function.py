import os
import json
import gzip
import boto3
import base64
import datetime
import uuid
import logging

# Initialize logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client("s3")
sqs_client = boto3.client("sqs")

# Configurations
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
DLQ_URL = os.getenv("DLQ_URL")  # SQS DLQ for failed logs
SERVICE_NAME = os.getenv("SERVICE_NAME")  # Name of the service for log identification
MAX_PAYLOAD_SIZE = 6 * 1024 * 1024  # 6MB batch size
MAX_MESSAGES = 100  # Maximum messages per batch

def lambda_handler(event, context):
    """
    AWS Lambda handler to process CloudWatch Logs and send them to S3.
    Args:
        event (dict): The event dictionary containing AWS CloudWatch log data.
        context (object): The context object containing runtime information.
    Returns:
        dict: A dictionary containing the status code and a message indicating the result of the log processing.
    Raises:
        Exception: If there is an error during log processing, the exception is caught and the logs are sent to a Dead Letter Queue (DLQ).
    """
    try:
        # Decode & decompress CloudWatch logs
        compressed_data = base64.b64decode(event.get("awslogs", {}).get("data", ""))
        decompressed_data = gzip.decompress(compressed_data).decode("utf-8")
        log_data = json.loads(decompressed_data)

        log_group = log_data.get("logGroup")
        log_stream = log_data.get("logStream")
        if not log_stream:
            log_stream = "unknown-log-stream"
            logger.info("Warning: logStream not found in log data, using default 'unknown-log-stream'")
        if not log_group:
            log_group = "unknown-log-group"
            print("Warning: logGroup not found in log data, using default 'unknown-log-group'")
            logger.info("Warning: logGroup not found in log data, using default 'unknown-log-group'")


        # Batch logs before sending to S3
        batches = batch_logs(log_data["logEvents"])

        for batch in batches:
            upload_to_s3(batch, log_group, log_stream)

        return {"statusCode": 200, "body": "Logs processed successfully"}
    
    except Exception as e:
        print(f"Error processing logs: {str(e)}")
        send_to_dlq(event)  # Send failed logs to DLQ
        return {"statusCode": 500, "body": str(e)}

def batch_logs(log_events):
    """ Splits logs into batches based on size & message count """
    print("Batching logs...")
    batches = []
    current_batch = []
    batch_size = 0

    for event in log_events:
        message = json.dumps({"timestamp": event["timestamp"], "message": event["message"]})
        message_size = len(message.encode("utf-8"))

        # If adding this message exceeds limits, start a new batch
        if batch_size + message_size > MAX_PAYLOAD_SIZE or len(current_batch) >= MAX_MESSAGES:
            batches.append(current_batch)
            current_batch = []
            batch_size = 0

        current_batch.append(message)
        batch_size += message_size

    # Add the last batch if it has logs
    if current_batch:
        batches.append(current_batch)
    print(f"Batched logs into {len(batches)} batches")
    return batches

def upload_to_s3(batch, log_group, log_stream):
    """ Uploads a batch of logs to S3 in gzip format """
    timestamp = datetime.datetime.utcnow().strftime("%Y/%m/%d/%H-%M-%S")
    sanitized_log_group = log_group.replace("/", "_").replace(":", "_")
    #sanitized_log_stream = log_stream.replace("/", "_").replace(":", "_")
    file_name = f"{SERVICE_NAME}/{sanitized_log_group}/{timestamp}-{uuid.uuid4()}.json.gz"

    try:
        compressed_data = gzip.compress("\n".join(batch).encode("utf-8"))

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=file_name,
            Body=compressed_data,
            ContentType="application/gzip"
        )
        print(f"Uploaded batch to S3: {file_name}")

    except Exception as e:
        print(f"Failed to upload logs to S3: {str(e)}")
        logger.error(f"Failed to upload logs to S3: {str(e)}")
        send_to_dlq(batch)  # Send failed logs to DLQ
        

def send_to_dlq(data):
    """ Sends failed logs to the Dead Letter Queue (DLQ) """
    if not DLQ_URL:
        print("DLQ not configured, cannot send failed logs")
        return
    
    try:
        sqs_client.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(data)
        )
        print("Sent failed log data to DLQ")

    except Exception as e:
        print(f"Failed to send logs to DLQ: {str(e)}")
        logger.error(f"Failed to send logs to DLQ: {str(e)}")

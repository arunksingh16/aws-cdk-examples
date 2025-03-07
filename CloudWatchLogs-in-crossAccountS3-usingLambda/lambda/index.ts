import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from "@aws-sdk/client-cloudwatch-logs";

const s3Client = new S3Client({ region: process.env.TARGET_REGION });
const cwClient = new CloudWatchLogsClient({ region: process.env.TARGET_REGION });

const targetS3Bucket = process.env.TARGET_S3_BUCKET!;
const targetLogGroup = process.env.TARGET_LOG_GROUP!;

exports.handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  for (const record of event.records) {
    const logMessage = Buffer.from(record.data, "base64").toString("utf-8");

    // Write logs to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: targetS3Bucket,
        Key: `logs/${Date.now()}.json`,
        Body: logMessage,
      })
    );

    // Write logs to CloudWatch Logs
    const logStreamName = `log-stream-${Date.now()}`;
    try {
      await cwClient.send(new CreateLogStreamCommand({ logGroupName: targetLogGroup, logStreamName }));
    } catch (error) {
      console.error("Log stream creation error:", error);
    }

    await cwClient.send(
      new PutLogEventsCommand({
        logGroupName: targetLogGroup,
        logStreamName,
        logEvents: [{ message: logMessage, timestamp: Date.now() }],
      })
    );
  }

  return { statusCode: 200, body: "Logs processed" };
};

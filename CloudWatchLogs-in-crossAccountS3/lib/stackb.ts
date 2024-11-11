import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as firehose from "aws-cdk-lib/aws-kinesisfirehose";
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CrossAccountDestination, CfnDestination } from "aws-cdk-lib/aws-logs";


interface StackBProps extends cdk.StackProps {
  // properties here
  source_accountID: string;
}

export class StackB extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly destination: CrossAccountDestination;

  constructor(scope: cdk.App, id: string, props: StackBProps) {
    super(scope, id, props);

    // centralised logging bucket for all logs

    const centralizedLoggingBucket = new Bucket(this, "centralized-logging-bucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsPrefix: "accessLogs",
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create the IAM role that grants Firehose permission to put data into the bucket.

    const centralizedLoggingRole = new Role(this, "centralized-logging-role", {
      assumedBy: new ServicePrincipal("firehose.amazonaws.com"),
    });

    // Create a permissions policy to define the actions that Firehose can perform in your account and associate this to the role.
    centralizedLoggingRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject",
          "s3:ListMultipartUploadParts",
        ],
        resources: [centralizedLoggingBucket.bucketArn, `${centralizedLoggingBucket.bucketArn}/*`],
      }),
    );

    // create the Firehose delivery stream and add the above created role to it

    const deliveryStream = new firehose.CfnDeliveryStream(this, "delivery-stream", {
      deliveryStreamType: "DirectPut",
      deliveryStreamEncryptionConfigurationInput: {
        keyType: "AWS_OWNED_CMK",
      },
      extendedS3DestinationConfiguration: {
        bucketArn: centralizedLoggingBucket.bucketArn,
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 64,
        },
        roleArn: centralizedLoggingRole.roleArn,
        prefix: "logs/",
      },
    });

    // When the delivery stream is active, create the IAM role that will grant CloudWatch Logs destination the permission to put data into your Firehose stream.

    const cloudWatchLogsToKinesisFirehoseRole = new iam.Role(this, "destination-role", {
      assumedBy: new iam.ServicePrincipal("logs.eu-central-1.amazonaws.com", {
        conditions: {
          StringLike: {
            "aws:SourceArn": [
              "arn:aws:logs:" + this.region + ":" + this.account + ":*",
              "arn:aws:logs:" + this.region + ":" + props.source_accountID + ":*",
            ],
            },
        },
      }),
      description: "A custom role for logs service with specific SourceArn conditions",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonKinesisFirehoseFullAccess"), // Attach the managed policy
      ],
    });

    //  Create a permissions policy to define which actions CloudWatch Logs can perform on your account.
    const cloudWatchLogsToKinesisFirehosePolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "firehose:PutRecord", 
        "firehose:PutRecordBatch", 
        "firehose:ListDeliveryStreams", 
        "firehose:DescribeDeliveryStream",
        "kms:*"],
      resources: [deliveryStream.attrArn],
    });

    cloudWatchLogsToKinesisFirehoseRole.addToPolicy(cloudWatchLogsToKinesisFirehosePolicyStatement);

    // Create a cw destination for the log group in region eu-central-1
    const DestinationName = "cwdestination-cdk";

    this.destination = new CrossAccountDestination(this, `cw-destination`, {
      targetArn: deliveryStream.attrArn,
      role: cloudWatchLogsToKinesisFirehoseRole,
      destinationName: DestinationName,
    });

    this.destination.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    /*
      we need to  associate an access policy with the destination. This policy enables the log data sender account to send log data to the destination.
      https://github.com/aws/aws-cdk/issues/2452
      access the low-level CloudFormation resource for a higher-level construct. We have to use this as 
      it overrides for properties that the high-level construct doesn’t expose.
    */
    const cfnDestination = this.destination.node.defaultChild as CfnDestination;
    cfnDestination.destinationPolicy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "AllowDevAccountToSubscribe",
          Effect: "Allow",
          Action: "logs:PutSubscriptionFilter",
          Principal: {
            AWS: `${props.source_accountID}`,
          },
          Resource: "arn:aws:logs:" + this.region + ":" + this.account + ":destination:" + DestinationName,
        },
      ],
    });

    new cdk.CfnOutput(this, `destinationName-arn`, {
      value: this.destination.destinationArn,
    });
  }
}

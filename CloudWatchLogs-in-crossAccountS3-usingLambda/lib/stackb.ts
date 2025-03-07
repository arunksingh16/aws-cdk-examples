import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export class RemoteS3 extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cross_account_roles = [
        'arn:aws:iam::AAAAAA:role/CloudWatchLogsProcessorRole',
        ];


    // Create an S3 bucket for logs
    const logBucket = new s3.Bucket(this, 'LogStorageBucket', {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: 'remote-s3-bucket-cdk-test',
      
    });

    // Define the IAM role - This lets Account A’s Lambda put objects into Bucket B.
    const s3BucketRole = new iam.Role(this, `LogStorageBucket-bucket-role`, {
        roleName: `remote-s3-bucket-cdk-test-role`,
        assumedBy: new iam.CompositePrincipal(
            ...cross_account_roles.map(role => new iam.ArnPrincipal(role))
        ),
    });

    s3BucketRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    logBucket.grantWrite(s3BucketRole);
  }
}

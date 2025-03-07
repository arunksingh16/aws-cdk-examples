import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as subscriptions from 'aws-cdk-lib/aws-logs-destinations';


export class CloudWatchToS3LambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const CROSS_ACCOUNT_ROLE_ARN = 'arn:aws:iam::BBBBBBB:role/remote-s3-bucket-cdk-test-role';

    const logGeneratorLambdaloggroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/aws/lambda/log-generator-lambda',
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

  // Lambda function to generate logs
  const logGeneratorLambda = new lambda.Function(this, 'LogGeneratorLambda', {
    runtime: lambda.Runtime.NODEJS_20_X,
    handler: 'index.handler',
    code: lambda.Code.fromInline(`
      exports.handler = async () => {
        console.log('This is a test log');
        return { statusCode: 200 };
      };
    `),
    logGroup: logGeneratorLambdaloggroup,
  });

    // Create an S3 bucket for logs
    const logBucket = new s3.Bucket(this, 'LogStorageBucket', {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      
    });

    // Create an SQS queue for Dead Letter Queue (DLQ)
    const dlq = new sqs.Queue(this, 'DLQ', {
      retentionPeriod: cdk.Duration.days(1),
    });
    // policy for cross account role (fluent bit)
    const AssumeRolePolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [CROSS_ACCOUNT_ROLE_ARN],
          actions: ["sts:AssumeRole"],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    const lambdrole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'CloudWatchLogsProcessorRole',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        new iam.ManagedPolicy(this, 'CloudWatchLogsProcessorPolicy', {
          document: AssumeRolePolicyDocument,
        }),
      ],
    });

    lambdrole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents', 'logs:CreateLogGroup'],
        resources: ['*'], 
      })
    );

    
    lambdrole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:*'],
        resources: ['*'],
      })
    );


    // Define the Lambda function
    const lambdaFn = new lambda.Function(this, 'CloudWatchLogsProcessor', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('lambdapy'), // Assuming code is in "lambda/" directory
      memorySize: 512,
      timeout: cdk.Duration.seconds(300),
      environment: {
        S3_BUCKET_NAME: logBucket.bucketName,
        DLQ_URL: dlq.queueUrl,
        SERVICE_NAME: 'CloudWatchLogsProcessor',
        FILTERED_S3_BUCKET_NAME: 'remote-s3-bucket-cdk-test',
        FILTER_STRING: 'ERROR',
        CROSS_ACCOUNT_ROLE_ARN: CROSS_ACCOUNT_ROLE_ARN,
      },
      reservedConcurrentExecutions: 5, // Prevents Lambda from overloading
      role: lambdrole,
    });

    // Grant permissions
    logBucket.grantWrite(lambdaFn);
    dlq.grantSendMessages(lambdaFn);




    lambdaFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      })
    );

    new logs.SubscriptionFilter(this, 'LogSubscription', {
      logGroup: logGeneratorLambdaloggroup,
      destination: new subscriptions.LambdaDestination(lambdaFn),
      filterPattern: logs.FilterPattern.allEvents(),
    });

    new cdk.CfnOutput(this, 'lambdrole', { 
      value: lambdrole.roleArn
    });

  }
}

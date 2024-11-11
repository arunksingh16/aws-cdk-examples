import * as cdk from "aws-cdk-lib";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";

export interface StackAProps extends cdk.StackProps {
  // properties here
  destinationArn: string;
}

export class StackA extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: StackAProps) {
    super(scope, id, props);

    // Lambda function to generate logs
    const logGeneratorFunction = new lambda.Function(this, "LogGeneratorFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log("Hello from Lambda!");
        };
      `),
    });

    // Log group for the Lambda function
    const logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: `/aws/lambda/${logGeneratorFunction.functionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // cw subscription filter
    new logs.CfnSubscriptionFilter(this, "KinesisDestination", {
      destinationArn: props.destinationArn,
      filterPattern: "",
      logGroupName: logGroup.logGroupName,
      filterName: "CrossAccountFirehoseDestination",
    });
  }
}

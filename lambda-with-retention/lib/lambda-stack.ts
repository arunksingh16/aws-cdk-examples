import { Duration, Stack, StackProps, lambda_layer_awscli } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Code, Function as LambdaFunction, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { join } from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lb = new LambdaFunction(this, 'hellolambda', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset(join(__dirname, '..', 'services','hello')),
      handler: 'hello.main',
      functionName: "Test",
      logRetention: RetentionDays.ONE_WEEK,

    })

  }
}

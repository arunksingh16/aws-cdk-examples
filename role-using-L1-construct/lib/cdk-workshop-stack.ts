import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
declare const assumeRolePolicyDocument: any;
declare const policyDocument: any;
export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    // role using L1 construct
    const cfnRole = new iam.CfnRole(this, 'Myrole', {
      assumeRolePolicyDocument: {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        },
        description: 'AWS Role using L1 construct',
    })
    
    // role using L2 construct

    const lambdaRole = new iam.Role(this, 'MyRole2', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'AWS Role using L2 construct.',
    });
    
    
  }
}

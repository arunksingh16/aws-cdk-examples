import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
declare const assumeRolePolicyDocument: any;
declare const policyDocument: any;
export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cfnRole = new iam.CfnRole(this, 'Myrole', {
      assumeRolePolicyDocument: {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        },
        description: 'AWS Role using L1 construct',
    })
    
    
  }
}

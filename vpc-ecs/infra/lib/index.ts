import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from  '../lib/constructs/VpcStack';
import { fargatestack } from './fargate-nested-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import {readFileSync} from 'fs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as path from 'path';
import * as cdkcore from 'aws-cdk-lib/core';


export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const prefix = this.node.tryGetContext('environment');

    const networkStack = new VpcStack(this, "ArunVPC", {
      environment: 'development',
      vpcCIDR: "10.0.0.0/16",
      vpcAZs: 2,
      vpcNGW: 2
    })

    const fargatCluster = new fargatestack(this, `${prefix}-fargate`,{
      environment: 'development',
      vpc: networkStack.vpc,
      taskMemLim: 512,
      taskCPU: 256,
    });

  }
}

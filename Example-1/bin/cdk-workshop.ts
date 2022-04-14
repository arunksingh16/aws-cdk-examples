#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkWorkshopStack } from '../lib/ASG-ELB-Stack';
import { NestedStack, Stack, Tag, Tags } from 'aws-cdk-lib';

// Amazon CDK articulates around three concepts : an Application, a Stack and Constructs. https://medium.com/swlh/deploy-your-auto-scaling-stack-with-aws-cdk-abae64f8e6b6
// app is execution, stack is unit being build ,constructs is building blocks 

//Update the CdkAppStack class instantiation 
const envEUTRN  = { account: 'XXXXX', region: 'eu-west-1' };
const envUSATRN = { account: 'XXXXX', region: 'us-west-2'};

// define new stack
const app = new cdk.App();
// The application code is straightforward. All you need is to import your stack(s) and instantiate it. 
new CdkWorkshopStack(app, 'my-cdk-stack-us', { env: envUSATRN });
new CdkWorkshopStack(app, 'my-cdk-stack-eu', { env: envEUTRN });
new CdkWorkshopStack(app, 'dev', { 
    env: { 
      account: process.env.CDK_DEFAULT_ACCOUNT, 
      region: process.env.CDK_DEFAULT_REGION 
  }});

interface EnvProps {
  prod: boolean;
}
app.synth();

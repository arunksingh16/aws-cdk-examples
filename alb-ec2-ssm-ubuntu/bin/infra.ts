#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc';
import { InfraStack } from '../lib/infra-stack';

const app = new cdk.App();

new VpcStack(app, 'VpcTestStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new InfraStack(app, 'InfraTestStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});


// tags
cdk.Tags.of(app).add("Name", "my-server");
cdk.Tags.of(app).add("Owner", "Arun");
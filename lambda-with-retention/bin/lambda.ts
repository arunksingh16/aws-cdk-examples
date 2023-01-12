#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/lambda-stack';

const envEUTRN  = { account: 'xxxxxx', region: 'eu-west-1' };
const app = new cdk.App();
new LambdaStack(app, 'LambdaStack', {
    stackName: "TEST"
});

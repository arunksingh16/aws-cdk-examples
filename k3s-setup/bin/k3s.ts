#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { K3SStack } from '../lib/k3s-stack';

const app = new cdk.App();
new K3SStack(app, 'K3SStack', {
  env: {
    account: '<>', // Replace with your AWS account ID
    region: 'eu-north-1', // Replace with your desired AWS region
  },
});
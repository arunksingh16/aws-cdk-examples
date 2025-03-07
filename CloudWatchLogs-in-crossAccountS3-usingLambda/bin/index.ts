#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudWatchToS3LambdaStack } from '../lib/stacka';
import { RemoteS3 } from '../lib/stackb';
const app = new cdk.App();

const stackaenv = {
  account: 'AAAAAA',
  region: 'eu-west-2'
};

new CloudWatchToS3LambdaStack(app, 'CloudWatchToS3LambdaStack',
  {
    env: stackaenv
  }
);


const crossaccountenv = {
  account: 'BBBBBBB',
  region: 'eu-west-2'
};

new RemoteS3(app, 'LambdaLogSendStack', {
  env: crossaccountenv
}
);
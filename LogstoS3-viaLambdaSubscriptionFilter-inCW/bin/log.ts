#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudWatchToS3LambdaStack } from '../lib/stacka';

const app = new cdk.App();
new CloudWatchToS3LambdaStack(app, 'CloudWatchToS3LambdaStack');

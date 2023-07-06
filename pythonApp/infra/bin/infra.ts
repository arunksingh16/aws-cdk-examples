#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib';
// The app constantly acts as the root of our CDK application. The reference to the app will be passed down to all our CDK stacks:
const app = new cdk.App();
// If you want to pass the env details
//const envEU  = { account: '111111', region: 'eu-west-1' };
//new InfraStack(app, 'InfraStack', { env: envEU });
new InfraStack(app, 'InfraStack', {
});

cdk.Tags.of(app).add('owner', "Arun Singh");
cdk.Tags.of(app).add('purpose', "poc");

// cdk deploy -c environment=dev

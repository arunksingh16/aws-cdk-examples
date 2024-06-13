#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api_gateway-stack';

const app = new cdk.App();
new ApiGatewayStack(app, 'test');

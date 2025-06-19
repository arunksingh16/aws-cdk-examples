#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWorkshopStack } from '../lib/cdk-workshop-stack';

const app = new cdk.App();
const myStack = new CdkWorkshopStack(app, 'CdkWorkshopStack');
// Add a tag to all constructs in the stack
cdk.Tags.of(myStack).add('Purpose', 'CDK Session');

// Remove the tag from all resources except subnet resources
cdk.Tags.of(myStack).remove('StackType', {
  excludeResourceTypes: ['AWS::EC2::Subnet']
});  

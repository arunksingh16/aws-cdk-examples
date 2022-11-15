#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcTestStack } from '../lib/vpc_test-stack';
import { ASGStack } from '../lib/asg';



const envUSATRN = { account: 'xxxxxxxx', region: 'us-west-2' };
const app = new cdk.App();

const CommonStack = new VpcTestStack(app, 'VpcTestStack', {
    env: envUSATRN,
    val_vpcAZs: 2,
    val_vpcNGW: 2,
    env_prefix: 'dev',
    val_imageId: 'ami-0bbee91e5afbb3e28',
    val_LC_ins_size: "t3.small",
    val_keyPair: 'login',
});


const ASG_Stack = new ASGStack(app, 'ASGStack', {
    env: envUSATRN,
    env_prefix: 'dev',
    VPC: CommonStack.vpc,
    val_ASGmaxSize: '2',
    val_ASGminSize: '2',
    val_ASGDisCapacity: '2',
    val_imageId: 'ami-0bbee91e5afbb3e28',
    vpcSubnetIDs: [CommonStack.vpc.privateSubnets[0].subnetId, CommonStack.vpc.privateSubnets[1].subnetId],
});

// ASG_Stack.addDependency(CommonStack);

cdk.Tags.of(CommonStack).add('Owner', 'Arun Singh');
cdk.Tags.of(ASG_Stack).add('Owner', 'Arun Singh');

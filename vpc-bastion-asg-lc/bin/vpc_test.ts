#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcTestStack } from '../lib/vpc_test-stack';



const envUSATRN = { account: 'xxxxxx', region: 'us-west-2' };

const app = new cdk.App();
const CommonStack = new VpcTestStack(app, 'VpcTestStack', {
    env: envUSATRN,
    val_vpcAZs: 2,
    val_vpcNGW: 2,
    env_prefix: 'dev',
    val_imageId: 'ami-0f9f005c313373218',
    val_LC_ins_size: "t2.medium",
    val_keyPair: 'login'
});

cdk.Tags.of(CommonStack).add('Owner', 'Arun Singh');

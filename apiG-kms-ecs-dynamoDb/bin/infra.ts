#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api_gateway-stack';
import { DynamoDBStack } from '../lib/dynamoDB';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { KMSStack } from '../lib/kmsStack';
import { ECSStack } from '../lib/ecsStack';
import { S3Stack } from '../lib/s3';

const app = new cdk.App();

const dynamoDBStack = new DynamoDBStack(app, 'DynamoDBStack', {
    tableName: 'test',
    partitionKey: { name: 'id', type: AttributeType.STRING },
    timeToLiveAttribute: 'ttl'
});

const kmsStack = new KMSStack(app, 'KMSStack', {
    keyAlias: '/poc/Encryption'
});

const ecsStack = new ECSStack(app, 'ECSStack', {
    port: 8888,
    keyAlias: kmsStack.alias.aliasArn,
    tableName: dynamoDBStack.table.tableName
});

console.log('kmsStack.alias.aliasArn', kmsStack.alias.aliasArn);

new ApiGatewayStack(app, 'APIGStack', {
    tableName: dynamoDBStack.table.tableName,
    vpcLink: ecsStack.vpcLink,
    albFargateService: ecsStack.ecsService
});

new S3Stack(app, 'S3Stack', {
});

cdk.Tags.of(app).add('project', 'Arun-Poc');

import { Duration, Stack, StackProps, App, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { CorsHttpMethod, DomainName, HttpApi, SecurityPolicy, CfnStage, HttpMethod, HttpStage } from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ApiGatewayStack extends Stack {

  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);


    // Define a Lambda function
    const myLambda = new lambda.Function(this, 'MyLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          return {
            statusCode: 200,
            body: 'Hello from Lambda!',
          };
        };
      `),
    });

    // Create a CloudWatch Logs Log Group
   const apiGatwayLogs = new LogGroup(this, `apigateway-logs`, {
          logGroupName: `/aws/api-gateway/test-apiGatewayLogs`,
          removalPolicy: RemovalPolicy.DESTROY,
    });

   apiGatwayLogs.grantWrite(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    const thisHttpApi = new HttpApi(this, `api`, {
      description: 'HTTP API',
      corsPreflight: {
          allowHeaders: [
              'Content-Type',
              'X-Amz-Date',
              'Authorization',
              'X-Api-Key',
              "method.response.header.Content-Type",
              "method.response.header.X-Content-Type-Options",
              "method.response.header.X-Frame-Options",
              "method.response.header.Content-Security-Policy",
              "method.response.header.Strict-Transport-Security"
          ],
          allowMethods: [
              CorsHttpMethod.OPTIONS,
              CorsHttpMethod.GET,
              CorsHttpMethod.POST,
              CorsHttpMethod.PUT,
              CorsHttpMethod.PATCH,
              CorsHttpMethod.DELETE,
          ],
      },

  });

  // Create the Lambda integration
  const lambdaIntegration = new HttpLambdaIntegration('LambdaIntegration', myLambda);

  thisHttpApi.addStage('beta', {
    stageName: 'beta',
    autoDeploy: true,  }
  )
  const stage = thisHttpApi.defaultStage?.node.defaultChild as CfnStage

  stage.accessLogSettings = {
      destinationArn: apiGatwayLogs.logGroupArn,
      format: JSON.stringify({
        requestId: '$context.requestId',
        extendedRequestId:"$context.extendedRequestId",
        userAgent: '$context.identity.userAgent',
        sourceIp: '$context.identity.sourceIp',
        requestTime: '$context.requestTime',
        requestTimeEpoch: '$context.requestTimeEpoch',
        httpMethod: '$context.httpMethod',
        path: '$context.path',
        status: '$context.status',
        protocol: '$context.protocol',
        responseLength: '$context.responseLength',
        domainName: '$context.domainName'
      })
    }


    // Add routes to the HTTP API
    thisHttpApi.addRoutes({
      path: '/hello',
      methods: [HttpMethod.GET],
      integration: lambdaIntegration,
    });
  }
  
}

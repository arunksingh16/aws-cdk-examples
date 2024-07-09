import { Duration, Stack, StackProps, App, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import {
  CorsHttpMethod,
  DomainName,
  HttpApi,
  SecurityPolicy,
  CfnStage,
  HttpMethod,
  HttpStage,
  ApiMapping,
  CfnApiGatewayManagedOverrides,
} from "aws-cdk-lib/aws-apigatewayv2";
import * as apiInt from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import path = require("path");
import { VpcLink } from "aws-cdk-lib/aws-apigatewayv2";

export interface ApiGatewayStackProps extends StackProps {
  readonly tableName: string;
  readonly vpcLink: VpcLink;
  readonly albFargateService: ecs_patterns.ApplicationLoadBalancedFargateService;
}

export class ApiGatewayStack extends Stack {
  constructor(scope: App, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Create a CloudWatch Logs Log Group
    const apiGatwayLogs = new LogGroup(this, `apigateway-logs`, {
      logGroupName: `/aws/api-gateway/test-apiGatewayLogs`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    apiGatwayLogs.grantWrite(new ServicePrincipal("apigateway.amazonaws.com"));

    const thisHttpApi = new HttpApi(this, `api`, {
      description: "Arun Test API",
      corsPreflight: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "method.response.header.Content-Type",
          "method.response.header.X-Content-Type-Options",
          "method.response.header.X-Frame-Options",
          "method.response.header.Content-Security-Policy",
          "method.response.header.Strict-Transport-Security",
        ],
        allowMethods: [
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: ["*"],
        maxAge: Duration.days(10),
      },
      createDefaultStage: true,
    });

    const healthIntegration = new apiInt.HttpAlbIntegration(
      "healthIntegration",
      props.albFargateService.loadBalancer.listeners[0],
      {
        vpcLink: props.vpcLink,
      },
    );

    thisHttpApi.addRoutes({
      path: "/health",
      methods: [HttpMethod.GET],
      integration: healthIntegration,
    });

    thisHttpApi.addRoutes({
      path: "/encrypt",
      methods: [HttpMethod.POST],
      integration: healthIntegration,
    });

    thisHttpApi.addRoutes({
      path: "/decrypt",
      methods: [HttpMethod.GET],
      integration: healthIntegration,
    });

    const cfnStage = thisHttpApi.defaultStage?.node.defaultChild as CfnStage; // api is of type HttpApi

    cfnStage.addPropertyOverride("DefaultRouteSettings", {
      ThrottlingBurstLimit: 1500,
      ThrottlingRateLimit: 1000,
    });

    cfnStage.accessLogSettings = {
      destinationArn: apiGatwayLogs.logGroupArn,
      format: JSON.stringify({
        requestId: "$context.requestId",
        extendedRequestId: "$context.extendedRequestId",
        userAgent: "$context.identity.userAgent",
        sourceIp: "$context.identity.sourceIp",
        requestTime: "$context.requestTime",
        requestTimeEpoch: "$context.requestTimeEpoch",
        httpMethod: "$context.httpMethod",
        path: "$context.path",
        status: "$context.status",
        protocol: "$context.protocol",
        responseLength: "$context.responseLength",
        domainName: "$context.domainName",
      }),
    };

  }
}

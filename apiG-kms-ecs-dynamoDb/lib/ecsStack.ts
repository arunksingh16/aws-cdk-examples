import { Duration, Stack, StackProps, App, RemovalPolicy } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import path = require("path");
import * as iam from "aws-cdk-lib/aws-iam";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { VpcLink } from "aws-cdk-lib/aws-apigatewayv2";

export interface ECSStackProps extends StackProps {
  readonly port: number;
  readonly keyAlias: string;
  readonly tableName: string;
}

export class ECSStack extends Stack {
  public readonly vpcLink: VpcLink;
  public readonly ecsCluster: ecs.Cluster;
  public readonly ecsService: ecs_patterns.ApplicationLoadBalancedFargateService;

  constructor(scope: App, id: string, props: ECSStackProps) {
    super(scope, id, props);

    const image = new DockerImageAsset(this, "MyDockerImage", {
      directory: path.join(__dirname, "..", "src"), // Adjust path as needed
    });

    const containerImage = ecs.ContainerImage.fromRegistry(image.imageUri);

    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 2, // Default is all AZs in region
    });

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc,
    });

    const TaskExecutionRolePolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ["*"],
          actions: [
            "cloudwatch:*",
            "ecr:*",
            "elasticloadbalancing:*",
            "s3:*",
            "logs:*",
            "ssm:*",
            "kms:*",
            "dynamodb:*",
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });


    // i am going to use this role for both task role and task execution role
    const TaskExecutionRole = new iam.Role(this, `fargate-TaskExecutionRole`, {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      description: `TaskExecutionRolePolicy`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonAPIGatewayInvokeFullAccess",
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy",
        ),
        new iam.ManagedPolicy(this, `ecs-fargate-TaskExecutionRole-policy`, {
          document: TaskExecutionRolePolicyDocument,
        }),
      ],
    });

    const taskDef = new ecs.FargateTaskDefinition(
      this,
      "ecs-fargate-task-def",
      {
        runtimePlatform: {
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
        },
        cpu: 512,
        memoryLimitMiB: 2048,
        executionRole: TaskExecutionRole,
        taskRole: TaskExecutionRole,
      },
    );

    taskDef.addContainer("appContainer", {
      image: ecs.ContainerImage.fromRegistry(image.imageUri),
      containerName: `python`,
      environment: {
        KMS_KEY_ID: `${props.keyAlias}`,
        DYNAMODB_TABLE_NAME: `${props.tableName}`,
      },
      portMappings: [{ containerPort: props.port }],
    });

    this.ecsService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "ecs-fargate-service",
      {
        cluster: cluster, // Required
        serviceName: `python`,
        taskDefinition: taskDef,
        desiredCount: 2,
        publicLoadBalancer: false, // Default is true
        protocol: elbv2.ApplicationProtocol.HTTP,
        loadBalancerName: `python-lb`, // lb has naming restrictions
        platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
        listenerPort: props.port,
        enableExecuteCommand: true, // You can use ECS Exec to run commands in or get a shell to a container running on an Amazon EC2 instance or on AWS Fargate
        circuitBreaker: {
          rollback: true,
        },
      },
    );

    this.ecsService.targetGroup.configureHealthCheck({
      path: "/health",
      timeout: Duration.seconds(10),
      healthyThresholdCount: 5,
      unhealthyThresholdCount: 5,
      interval: Duration.seconds(15),
      port: `${props.port}`,
    });

    this.vpcLink = new VpcLink(this, `vpc-link`, {
      vpc: vpc,
      vpcLinkName: `vpc-link`,
      subnets: { subnets: vpc.privateSubnets },
      securityGroups: [this.ecsService.service.connections.securityGroups[0]],
    });
  }
}

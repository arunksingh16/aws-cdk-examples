import * as cdk from 'aws-cdk-lib';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';


export interface FargateProps {
  /**
   * The VPC associated with the cluster.
   */
  readonly vpc: ec2.Vpc;
  environment: string;
  readonly taskMemLim: number;
  readonly taskCPU: number;
  //readonly roleFargate: iam.IRole;
  /**
   * Determines whether the delete cluster policy is assigned
   *
   * @default true
   */
  readonly deleteClusterApplyRemovalPolicy?: boolean;
}

export class ecsFargate extends Construct {
  public readonly deleteClusterApplyRemovalPolicy: boolean;

    constructor(scope: Construct, id: string, props: FargateProps) {
      super(scope, id);

      const cluster = new ecs.Cluster(this, `${props?.environment}-ecs-cluster`, {
        vpc: props.vpc,
        clusterName: `${props?.environment}-ecs-cluster`,
      });
      // in case it is null or undefined please assign value true
      this.deleteClusterApplyRemovalPolicy = props.deleteClusterApplyRemovalPolicy ?? true;
      
      if (this.deleteClusterApplyRemovalPolicy) {
        // Code block executed if the condition is true
        console.log("The condition is true.");
        cluster.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      } else {
        // Code block executed if the condition is false
        console.log("The condition is false.");
      }
  
      const taskDef = new ecs.FargateTaskDefinition(this, `${props?.environment}-task-def`, {
        memoryLimitMiB: props.taskMemLim,
        cpu: props.taskCPU,
        //executionRole: props.roleFargate
      });
  
      const containerDef = new ecs.ContainerDefinition(this, `${props?.environment}-container-def`, {
        image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        taskDefinition: taskDef, 
        containerName: `${props?.environment}-container`
        //portMappings: [{ containerPort: 3000 }],
        
      });
  
      containerDef.addPortMappings({
        containerPort: 80
      });
  
      // Create a load-balanced Fargate service and make it public
      const albFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `${props?.environment}-fargate`, {
        cluster: cluster, // Required
        taskDefinition: taskDef,
        desiredCount: 2, // Default is 1
        publicLoadBalancer: true, // Default is true
        loadBalancerName: `${props?.environment}-lb-ecs`
      });
  
      // Override Platform version (until Latest = 1.4.0)
      const albFargateServiceResource = albFargateService.service.node.findChild('Service') as ecs.CfnService;
      albFargateServiceResource.addPropertyOverride('PlatformVersion', '1.4.0')
  
    }
  }

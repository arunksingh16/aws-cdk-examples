import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as CldWat from "aws-cdk-lib/aws-cloudwatch"
import * as path from 'path';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';



export class CdkWorkshopStack extends cdk.Stack {
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: "MyVPC",
      enableDnsHostnames: false,
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'publicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'privateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }, 
      ]   
    });

    // const publicSubnet2 = new ec2.PublicSubnet(this, 'MyPublicSubnet2', {
    //   availabilityZone: 'us-west-2b',
    //   cidrBlock: '10.0.2.0/18',
    //   vpcId: vpc.vpcId,
    //   // the properties below are optional
    //   mapPublicIpOnLaunch: false,
    // });

    // const privateSubnet1 = new ec2.PrivateSubnet(this, 'MyPrivateSubnet1', {
    //   availabilityZone: 'us-west-2a',
    //   cidrBlock: '10.0.3.0/18',
    //   vpcId: vpc.vpcId,
    
    //   // the properties below are optional
    //   mapPublicIpOnLaunch: false,
    // });


    const linux = new ec2.GenericLinuxImage({
      'us-west-2': 'ami-0b36cd6786bcfe120'
      // ...
    });

    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      autoScalingGroupName: 'MYASG',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: linux,
      //machineImage: new ec2.AmazonLinuxImage(),
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 3,
    });


    asg.scaleOnCpuUtilization('CPU70', {
      targetUtilizationPercent: 70
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: false,
    });

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    listener.addTargets('Target', {
      port: 80,
      targets: [asg] //Reference of our Austo Scaling group.

    });

    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

  }
}

// const app = new cdk.App();
// new CdkWorkshopStack(app, 'MyLBStack');
// app.synth();

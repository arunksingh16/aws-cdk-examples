import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ContextProps } from './constructs';

export class WindowsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 2,
      natGateways: 1,
      
    });
    cdk.Tags.of(vpc).add('Name', `arun-vpc`);

    // Security Group
    const bastionSG = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for Bastion Host',
    });
    bastionSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3389), 'Allow RDP access');
    // Windows Bastion Host
    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: bastionSG,
      associatePublicIpAddress: true,
      keyName: 'bastion', // Replace with your key pair name
    });

    new cdk.CfnOutput(this, 'BastionHostPublicIP', {
      value: bastionHost.instancePublicIp,
      description: 'The public IP of the Bastion Host',
    });    

  }
}

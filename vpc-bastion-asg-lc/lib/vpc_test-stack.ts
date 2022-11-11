import { Duration, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from 'path';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as asg from 'aws-cdk-lib/aws-autoscaling';
import { readFileSync } from 'fs';

export interface NetworkStackProps extends StackProps {
  // not mandatory
  env_prefix: string,
  val_vpcCIDR?: string,
  val_vpcAZs: number,
  val_vpcNGW: number,
  val_imageId: string,
  val_LC_ins_size: string,
  val_keyPair: string
}

export class VpcTestStack extends Stack {

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);
    // vpc
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${props.env_prefix}-vpc`,
      //availabilityZones: ['us-west-2a','us-west-2b'],
      enableDnsHostnames: false,
      cidr: "172.31.0.0/16",
      maxAzs: props.val_vpcAZs ?? 2,
      natGateways: props.val_vpcAZs ?? 2,
      subnetConfiguration: [
        {
          name: 'publicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
          mapPublicIpOnLaunch: false,
        },
        {
          name: 'privateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,

        },
      ]
    });

    // security group 
    const BasSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: `${props.env_prefix}-sg-bastion`,
      description: 'Security Group for Bastion Servers'
    });

    BasSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(),ec2.Port.tcp(22),'allow SSH access from anywhere');


    //role
    const BastionRole = new iam.Role(this, 'BastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // bastion
    const bastion = new ec2.Instance(this, 'BastionServer', {
      vpc,
      instanceName: `${props.env_prefix}-bastion-server`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: BastionRole,
      securityGroup: BasSecurityGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2,ec2.InstanceSize.MICRO,),
      machineImage: new ec2.AmazonLinuxImage({generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,}),
      keyName: props.val_keyPair,
    });
    // userdata script
    const userDataScript = readFileSync('./lib/user-data.sh', 'utf8');
    bastion.addUserData(userDataScript);


    // create an instance profile for this role to be attached to a launch configuration
    const LaunchConfigurationInstanceProfile = new iam.CfnInstanceProfile(this, 'LaunchConfigurationInstanceProfile', {
      roles: [BastionRole.roleName],
      instanceProfileName: `${props.env_prefix}-instance-profile`,
    });

    // launch config
    const cfnLaunchConfiguration = new asg.CfnLaunchConfiguration(this, 'LaunchConfiguration', {
      instanceType: props.val_LC_ins_size,
      imageId: props.val_imageId,

      // the properties below are optional
      blockDeviceMappings: [{
        deviceName: '/dev/sda1',

        // the properties below are optional
        ebs: {
          deleteOnTermination: false,
          encrypted: false,
          volumeSize: 8,
          volumeType: 'gp3',
        },
      }],

      ebsOptimized: false,
      iamInstanceProfile: LaunchConfigurationInstanceProfile.instanceProfileName,
      instanceMonitoring: false,
      keyName: props.val_keyPair,
      launchConfigurationName: `${props.env_prefix}-lc-${props.val_imageId}`,
      securityGroups: [BasSecurityGroup.securityGroupId]
    });

  }
}

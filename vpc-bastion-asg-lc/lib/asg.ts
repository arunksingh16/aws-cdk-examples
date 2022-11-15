import { Duration, Stack, StackProps, Tags, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as asg from 'aws-cdk-lib/aws-autoscaling';

export interface ASGStackProps extends StackProps {
  env_prefix: string,
  VPC: ec2.Vpc,
  val_imageId: string,
  val_ASGmaxSize: string,
  val_ASGminSize: string,
  val_ASGDisCapacity: string,
  vpcSubnetIDs: string[],
}

export class ASGStack extends Stack {

  constructor(scope: Construct, id: string, props: ASGStackProps) {
    super(scope, id, props);

    // ASG
    const autoScalingGroup = new asg.CfnAutoScalingGroup(this, `${props.env_prefix}-AutoScalingGroup`, {
      maxSize: props.val_ASGmaxSize,
      minSize: props.val_ASGminSize,
      autoScalingGroupName: `${props.env_prefix}-ASG`,
      desiredCapacity: props.val_ASGDisCapacity,
      launchConfigurationName: `${props.env_prefix}-lc-${props.val_imageId}-v4`, //cfnLaunchConfiguration.launchConfigurationName,
      //vpcZoneIdentifier: [Fn.importValue('Subnet1'), Fn.importValue('Subnet2')]
      //vpcZoneIdentifier: [props.VPC.privateSubnets[0].subnetId,props.VPC.privateSubnets[1].subnetId]
      vpcZoneIdentifier: props.vpcSubnetIDs,
      healthCheckGracePeriod: 600,
      healthCheckType: 'EC2',
      terminationPolicies: ['OldestInstance']
    });
    Tags.of(autoScalingGroup).add("Name", "D-AutoScalingGroup");

  }
}

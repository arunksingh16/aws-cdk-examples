import { Duration, Stack, StackProps, Tags, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends Stack {
    public readonly vpc: ec2.Vpc;
  
    // rest of the items will be added in constructor function
    constructor(scope: Construct, id: string, props: StackProps) {
      super(scope, id, props);
      console.log('REGION ', process.env.AWS_DEFAULT_REGION);
  
      this.vpc = new ec2.Vpc(this, 'VPC', {
        vpcName: `my-vpc`,
        //availabilityZones: ['us-west-2a','us-west-2b'],
        enableDnsHostnames: false,
        cidr: "172.32.0.0/16",
        maxAzs: 2,
        natGateways: 1,
        subnetConfiguration: [
          {
            name: 'PublicSubnet',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
            mapPublicIpOnLaunch: false,
          },
          {
            name: 'PrivateSubnet',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24,
  
          },
        ]
      });
      Tags.of(this.vpc).add("Name", `my-vpc`);

  }
}
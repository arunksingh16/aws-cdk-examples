import  * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface NetworkStackProps extends cdk.StackProps {
  environment: string;
  vpcCIDR: string,
  vpcAZs: number,
  vpcNGW: number,
}

export class VpcStack extends Construct {
  public readonly vpc: ec2.Vpc
  constructor(scope: Construct, id: string, props?: NetworkStackProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${props?.environment}-vpc` ?? 'dummy',
      enableDnsHostnames: false,
      enableDnsSupport: true,
      // "172.31.0.0/16"
      //cidr: props?.vpcCIDR ?? ec2.IpAddresses.cidr, 
      ipAddresses: ec2.IpAddresses.cidr(`${props?.vpcCIDR}`),
      maxAzs: props?.vpcAZs ?? 2,
      natGateways: props?.vpcNGW ?? 2,
      subnetConfiguration: [
        {
          name: 'publicSubnet-',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
          mapPublicIpOnLaunch: true,
        },
        {
          name: 'privateSubnet-',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
            name: 'isolatedSubnet-',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 24,
          },
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3
        }
      }
    });
    cdk.Tags.of(this.vpc).add('Name',`${props?.environment}-vpc` as string);

  }
}

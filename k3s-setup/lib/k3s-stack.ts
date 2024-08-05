import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class K3SStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // adding vpc
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    cdk.Tags.of(vpc).add('Name', `arun-vpc`);

    // keypair for login, you need to add a keypair manually first with name k3s

    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'k3s');

    // Policy for bastion server
    const bastionPolicy = new iam.Policy(this, 'EC2InstanceConnectPolicy', {
      policyName: 'EC2InstanceConnectPolicy',
      statements: [
        new iam.PolicyStatement({
          actions: [
            'ec2-instance-connect:SendSSHPublicKey',
            'ec2:DescribeInstances',
          ],
          resources: ['*'], // You can restrict this further by specifying resources if needed
        }),
      ],
    });

    // Create a role for the bastion host
    const bastionInstanceRole = new iam.Role(this, 'BastionInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforSSM'),
      ]
    });

    // Attach the policy to the role
    bastionInstanceRole.attachInlinePolicy(bastionPolicy);

    // Security Group for bastion
    const bastionSG = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for Bastion Host',
    });
    bastionSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');

    // Finally lets provision our ec2 instance
    const bastion = new ec2.Instance(this, 'bastion', {
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: bastionSG,
      instanceName: 'bastion-host',
      instanceType: ec2.InstanceType.of( // t2.micro has free tier usage in aws
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      keyPair: keyPair,
      associatePublicIpAddress: true,
      role: bastionInstanceRole,
    });

    // security group for k3s server

    const k3serverSecurityGroup = new ec2.SecurityGroup(this, 'k3serverSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'k3s-server-sg',
    });
    
    // security group for k3s agent

    const k3agentnodeSecurityGroup = new ec2.SecurityGroup(this, 'k3agentnodeSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'k3s-node-sg',
    });

    // ingress rules
    k3serverSecurityGroup.addIngressRule(bastion.connections.securityGroups[0], ec2.Port.tcp(22), 'Allow SSH access from Bastion Host');
    k3serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6443), 'K3s supervisor and Kubernetes API Server');
    k3serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(10250), 'Kubelet metrics');
    k3serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access from Bastion Host');
    k3serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcpRange(2379,2380), 'Required only for HA with embedded etcd');
    k3serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(30007), 'Service Exposure');
    k3serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Service Exposure');
    k3serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(8472), 'The nodes need to be able to reach other nodes over UDP port 8472 when using the Flannel VXLAN backend');
    k3serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(51820), 'The nodes need to be able to reach other nodes over UDP port 8472 when using the Flannel VXLAN backend');



    k3agentnodeSecurityGroup.addIngressRule(bastion.connections.securityGroups[0], ec2.Port.tcp(22), 'Allow SSH access from Bastion Host');
    k3agentnodeSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6443), 'K3s supervisor and Kubernetes API Server');
    k3agentnodeSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(10250), 'Kubelet metrics');
    k3agentnodeSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcpRange(2379,2380), 'Required only for HA with embedded etcd');
    k3agentnodeSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Service Exposure');
    k3agentnodeSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(30007), 'Service Exposure');
    k3agentnodeSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(8472), 'The nodes need to be able to reach other nodes over UDP port 8472 when using the Flannel VXLAN backend');
    k3agentnodeSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(51820), 'The nodes need to be able to reach other nodes over UDP port 8472 when using the Flannel VXLAN backend');


    // ami select (ubuntu)
    const specificAmi = ec2.MachineImage.genericLinux({
      'eu-north-1': 'ami-07a0715df72e58928',
      
    });

    
    const k3sagent = new ec2.Instance(this, 'k3sagent', {
      instanceType: ec2.InstanceType.of( // t2.micro has free tier usage in aws
        ec2.InstanceClass.T3,
        ec2.InstanceSize.LARGE
      ),
      machineImage: specificAmi,
      //machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup: k3agentnodeSecurityGroup,
      instanceName: 'k3s-agent-host',
      keyPair: keyPair,
    });


    const k3server = new ec2.Instance(this, 'k3server', {
      instanceType: ec2.InstanceType.of( // t2.micro has free tier usage in aws
        ec2.InstanceClass.T3,
        ec2.InstanceSize.LARGE
      ),
      machineImage: specificAmi,
      //machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup: k3serverSecurityGroup,
      instanceName: 'k3s-server-host',
      keyPair: keyPair,
    });    

    new cdk.CfnOutput(this, 'BastionHostPublicIP', {
      value: bastion.instancePublicIp,
      description: 'The public IP of the Bastion Host',
    });

    // nlb create

    const nlbSecGroup = new ec2.SecurityGroup(this, 'nlbSecGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'nlb-sg',
    });
    nlbSecGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Service Exposed on NodePort 8080');
    nlbSecGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(30007), 'Service Exposed on NodePort 30007');

    const nlb = new elbv2.NetworkLoadBalancer(this, 'NLB', {
      vpc,
      loadBalancerName: 'k3s-nlb',
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [nlbSecGroup],
      ipAddressType: elbv2.IpAddressType.IPV4,
    });

    const listener = nlb.addListener('Listener', {
      port: 30007,
    });

    listener.addTargets('Target', {
      port: 30007,
      //https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_elasticloadbalancingv2_targets.InstanceTarget.html
      targets: [new targets.InstanceIdTarget(k3server.instanceId, 30007), new targets.InstanceIdTarget(k3sagent.instanceId, 30007), new targets.InstanceIdTarget(k3sagent2.instanceId, 30007)],
     });
  }
}

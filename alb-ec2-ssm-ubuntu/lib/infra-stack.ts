import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elasticloadbalancingv2_targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const MYEnvInstanceRole = new iam.Role(this, "MYEnvInstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "Role for the instance",
    });

    const accountId = this.account;
    const region = this.region;

    const MYEnvSSMPolicy = new iam.ManagedPolicy(this, 'MYEnvSSMPolicy', {
      description: 'IAM policy for server instances to allow SSM access',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ssm:StartSession",
            "sts:GetCallerIdentity",
            "ssm:ResumeSession"
          ],
          resources: [
            `arn:aws:ec2:${region}:${accountId}:instance/*`,
            `arn:aws:ssm:${region}:${accountId}:document/SSM-SessionManagerRunShell`,
            "arn:aws:ssm:*:*:document/AWS-StartPortForwardingSession"
          ],
          conditions: {
            BoolIfExists: {
              "ssm:SessionDocumentAccessCheck": "true"
            }
          }
        }),

        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ssm:DescribeSession",
            "ssm:GetConnectionStatus",
            "ssm:DescribeInstanceProperties",
            "ec2:DescribeInstances"
          ],
          resources: ["*"],
        }),

        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["ssm:TerminateSession"],
          resources: [
            "arn:aws:ssm:*:*:session/${aws:username}-*"
          ]
        }),

        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel"
          ],
          resources: ["*"],
        }),

        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ec2messages:AcknowledgeMessage",
            "ec2messages:DeleteMessage",
            "ec2messages:FailMessage",
            "ec2messages:GetEndpoint",
            "ec2messages:GetMessages",
            "ec2messages:SendReply"
          ],
          resources: ["*"]
        }),

        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "kms:CreateGrant",
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:GenerateDataKeyWithoutPlainText",
            "kms:GenerateDataKey",
            "kms:ReEncryptTo",
            "kms:ReEncryptFrom"
          ],
          resources: ["*"]
        }),

        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ebs:StartSnapshot",
            "ebs:GetSnapshotBlock",
            "ebs:PutSnapshotBlock",
            "ebs:CompleteSnapshot",
            "ebs:ListSnapshotBlocks",
            "ebs:ListChangedBlocks",
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
          ],
          resources: ["*"]
        }),

        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["iam:PassRole"],
          resources: ["arn:aws:iam::*:role/*"]
        })
      ]
    });

    // # Attach the custom policy to the role
    MYEnvInstanceRole.addManagedPolicy(MYEnvSSMPolicy);
    // # Attach AWS managed SSM policy for Session Manager functionality
    MYEnvInstanceRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    // Create instance profile for EC2 instances
    const MYEnvInstanceProfile = new iam.InstanceProfile(this, 'MYEnvInstanceProfile', {
      role: MYEnvInstanceRole,
    });

    const vpc = ec2.Vpc.fromLookup(this, "Vpc", {
      tags: { Name: `MYEnv-vpc` },
    });

    const specificAmi = ec2.MachineImage.genericLinux({
      'eu-west-1': 'ami-049442a6cf8319180',

    });

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Security group for server",
      allowAllOutbound: true,
    });

    const rootVolume: ec2.BlockDevice = {
      deviceName: '/dev/sda1', // Use the root device name from Step 1
      volume: ec2.BlockDeviceVolume.ebs(100), // Override the volume size in Gibibytes (GiB)
    };

    const MYEnvServer = new ec2.Instance(this, "MYEnvServer", {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.MEDIUM),
      instanceName: "my-server",
      machineImage: specificAmi,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup: securityGroup,
      instanceProfile: MYEnvInstanceProfile,
      keyPair: ec2.KeyPair.fromKeyPairName(this, "MYEnvKeyPair", 'arun-zzz-eu-west-1'),
      blockDevices: [
        rootVolume
      ]

    });

    let initScriptPath = 'lib/init-script.sh';
    const userData = fs.readFileSync(initScriptPath, 'utf8');
    MYEnvServer.addUserData(userData);
    MYEnvServer.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "Allow SSH from the world");
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow HTTP from the world");
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow HTTPS from the world");
    cdk.Tags.of(MYEnvServer).add('Name', 'my-server');


    // i need to add alb in the public subnet and attach it to port 80 of the server
    const alb = new elbv2.ApplicationLoadBalancer(this, 'MYEnvALB', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: securityGroup,
      loadBalancerName: 'my-alb',
      internetFacing: true,
    });

    const listener = alb.addListener('MYEnvALBListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });



    const instanceIdTarget = new elasticloadbalancingv2_targets.InstanceIdTarget(MYEnvServer.instanceId, 80);

    // const tg = new elbv2.ApplicationTargetGroup(this, 'TG', {
    //   targetType: elbv2.TargetType.INSTANCE,
    //   port: 80,
    //   protocol: elbv2.ApplicationProtocol.HTTP,
    //   vpc,
    //   healthCheck: {
    //     path: '/',
    //     port: '80',
    //     healthyHttpCodes: '200',
    //     interval: cdk.Duration.seconds(30),
    //     timeout: cdk.Duration.seconds(10),
    //   },
    // });

    listener.addTargets('MYEnvALBTargets', {
      targetGroupName: 'my-targets',
      targets: [instanceIdTarget],
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      stickinessCookieDuration: cdk.Duration.days(1),
    })

    const httpsListener = alb.addListener('MYEnvALBHttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [
        elbv2.ListenerCertificate.fromArn('arn:aws:acm:eu-west-1:zzz:certificate/zzz-zzz-zz-zz-zzz')
      ],
    });

    httpsListener.addTargets('MYEnvALBHttpsTargets', {
      targetGroupName: 'my-https-targets',
      targets: [instanceIdTarget],
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      stickinessCookieDuration: cdk.Duration.days(1),
      healthCheck: {
        path: '/',
        port: '80',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
      },
    });

  }
}

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import { SecretValue } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class OpensearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      createInternetGateway: true,
      
    });

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'LinuxSecurityGroup',
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from anywhere');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from anywhere');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH traffic from anywhere');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(9200), 'Allow SSH traffic from anywhere');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8157), 'Allow SSH traffic from anywhere');
    // add linux 
    const linuxInstance = new ec2.Instance(this, 'LinuxInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup,
      keyName: 'opensearch',
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      associatePublicIpAddress: true
      });

    linuxInstance.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonOpenSearchServiceFullAccess'));


    const esSecurityGroup = new ec2.SecurityGroup(this, 'EsSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'EsSecurityGroup',
    });

    esSecurityGroup.addIngressRule(securityGroup, ec2.Port.tcp(443));


    // OpenSearch domain
    const domain = new opensearch.Domain(this, "Domain", {
      vpc,
      vpcSubnets: [
        { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      ],
      securityGroups: [esSecurityGroup],
      version: opensearch.EngineVersion.OPENSEARCH_2_5,
      tlsSecurityPolicy: opensearch.TLSSecurityPolicy.TLS_1_2,
      enableVersionUpgrade: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      zoneAwareness: {
        enabled: false,
      },
      capacity: {
        dataNodeInstanceType: "t3.small.search",
        dataNodes: 2,
        multiAzWithStandbyEnabled: false,
      },
      fineGrainedAccessControl: {
        masterUserName: 'admin',
        masterUserPassword: SecretValue.plainText('<your password>'),
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      enforceHttps: true,
    });
    domain.node.addDependency(linuxInstance);
    const cfndomain = domain.node.tryFindChild('Resource') as opensearch.CfnDomain

    const selectedSubnetIds = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds
    cfndomain.addPropertyOverride('VPCOptions.SubnetIds', [ selectedSubnetIds[0] ] )

    const PolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['es:*'],
      principals: [new iam.AnyPrincipal()],
      resources: [domain.domainArn + "/*"],
    });

    domain.addAccessPolicies(PolicyStatement);

    // Outputs
    new cdk.CfnOutput(this, "OpenSearchDomainHost", {
      value: domain.domainEndpoint,
    });

  }
}

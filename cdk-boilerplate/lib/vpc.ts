// vpc.ts
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    Tags.of(this.vpc).add("Name", `${props.env?.account}-vpc`);
  }
}

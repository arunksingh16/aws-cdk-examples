// lambda-stack.ts
export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "Vpc", {
      tags: { Name: `${props.env?.account}-vpc` },
    });

    new lambda.Function(this, "Lambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline("exports.handler = () => {};"),
      vpc,
    });
  }
}

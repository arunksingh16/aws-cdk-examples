const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new NetworkStack(app, "NetworkStack", { env });
new LambdaStack(app, "LambdaStack", { env });


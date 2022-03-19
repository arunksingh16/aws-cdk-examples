# aws-cdk
AWS CDK

### Terms
- A `construct` represents a "cloud component" and encapsulates everything AWS CloudFormation needs to create the component. A construct can represent a single AWS resource, such as an Amazon Simple Storage Service (Amazon S3) bucket, or it can be a higher-level abstraction consisting of multiple AWS related resources. https://docs.aws.amazon.com/cdk/v2/guide/constructs.html

- Every `cdk` app can consist of one or more `Stacks`. If you're familiar with stacks in CloudFormation, it's the same thing.


### constructs

every constructs receive the same 3 parameters:

- The scope parameter specifies the parent construct within which the child construct is initialized. In JavaScript we use the this keyword, in Python self, etc.

- The id parameter - an identifier that must be unique within the scope. The combination of CDK identifiers for a resource builds the CloudFormation Logical ID of the resource. I've written an article - What is an identifier in AWS CDK if you want to read more.

- The props parameter - key-value pairs used to set configuration options for the resources, that the construct provisions. Note that the props of different constructs vary.


### Use save exact
Use `--save-exact` flag to lock down the version of the installed packages.
```
npm install --save-exact \
  @aws-cdk/aws-s3@latest \
  @aws-cdk/aws-dynamodb@latest \
  aws-cdk@latest
```

### Using multi profile
- By default, CDK commands will use the default AWS CLI profile. However, you can specify custom profile in `cdk.json`
```
{
  "app": "npx ts-node --prefer-ts-exts bin/cdk-workshop.ts",
  "profile": "<custom-profile>",
}
```
- We can use the CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION environment variables. These are set and made available by the CDK CLI.

- Use in `cdk` command line
```
npx cdk synth --profile my-profile my-stack
```

### cdk commands

- `cdk diff`
- `cdk list --long` -  lists the names of all of the stacks in our CDK App.
-  `cdk synth`
-  `cdk deploy --outputs-file ./`

# aws-cdk
Defining AWS resources in your CDK app is exactly like defining any other construct. You create an instance of the construct class, pass in the scope as the first argument, the logical ID of the construct, and a set of configuration properties (props). 

### Terms
- A `construct` represents a "cloud component" and encapsulates everything AWS CloudFormation needs to create the component. A construct can represent a single AWS resource, such as an Amazon Simple Storage Service (Amazon S3) bucket, or it can be a higher-level abstraction consisting of multiple AWS related resources. https://docs.aws.amazon.com/cdk/v2/guide/constructs.html

- The unit of deployment in the AWS CDK is called a `stack`. If you're familiar with stacks in CloudFormation, it's the same thing.

- `Context` in CDK is a combination of key-value pairs we can set in our CDK application. The AWS CDK uses context to cache information from your AWS account, such as the Availability Zones in your account 

### constructs

every constructs receive the same 3 parameters:

- The scope parameter specifies the parent construct within which the child construct is initialized. In JavaScript we use the this keyword, in Python self, etc.

- The id parameter - an identifier that must be unique within the scope. The combination of CDK identifiers for a resource builds the CloudFormation Logical ID of the resource. I've written an article - What is an identifier in AWS CDK if you want to read more.

- The props parameter - key-value pairs used to set configuration options for the resources, that the construct provisions. Note that the props of different constructs vary.

- You can specify a physical name when creating constructs that represent resources by using the property <resourceType>Name.
```
const bucket = new s3.Bucket(this, 'MyBucket', {
  bucketName: 'my-bucket-name',
})
```


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
- To make the stack deployable to a different target, but to determine the target at synthesis time, your stack can use two environment variables `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`. These are set and made available by the CDK CLI.

- Use in `cdk` command line
```
npx cdk synth --profile my-profile my-stack
```

### cdk commands

- `cdk diff`
- `cdk list --long` -  lists the names of all of the stacks in our CDK App.
- `cdk synth`
- `cdk deploy --outputs-file ./`
- `cdk doctor`

### Best Practices 
- using Parameters in our CDK applications is not recommended from the AWS team.
- CDK team recommend using environment variables and context, which are resolved at synthesis time and can be used in our CDK code to conditionally provision / update resources.

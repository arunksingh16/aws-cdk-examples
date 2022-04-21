# AWS CDK
Defining AWS resources in your CDK app is exactly like defining any other construct. You create an instance of the construct class, pass in the scope as the first argument, the logical ID of the construct, and a set of configuration properties (props). 
- `cdk app` is a special root construct
- `cdk` is `idempotent` (check resource hash in cfn using same app id or resource name, it will always produce the same.)

### CDK 2.x
- Massive improvement
- 1 npm library to install. CDK 1 had indivisual library for each module. Starting in v2, all of the AWS Construct Library comes into a single package, called `aws-cdk-lib`. You get access to all the AWS CDK constructs by installing this package, and third-party construct libraries only need to take a dependency on this package as well.
- In CDK 2.x AWS has extracted the constructs programming model into a separate library, called `constructs`

We also extracted the constructs programming model into a separate library, called constructs. 

### CDK CONSTRUCTS
- LEVEL 0 - BASIC RES
- LEVEL 1 - CFN RES 
- LEVEL 2 - UPGRADED L1 CONSTRUCTS, INCLUDE HELPER METHODS AND DEFAULTS
- LEVEL 4 - COMBINANTION OF CONSTRUCT

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
- `cdk bootstrap`
- `cdk list --long` -  lists the names of all of the stacks in our CDK App.
- `cdk synth`
- `cdk deploy --outputs-file ./`
- `cdk doctor`
  
### Synthesis
- `cdk synth` generated the cfn template by traversing the app tree. It invokes the synthesize method on all constructs. It also generates unique ID for cfn.

### Assets
- file bundled with cdk app. Like lambda functions. How these assests get deployed? The ans is: `cdk bootstrap` deploys a `CDKToolkit` cloudformation stack which will create s3 bucket to store assets and cfn templates. `cdk bootstrap` start placing all items in `cdk.out` folder. 

### Best Practices 
- using Parameters in our CDK applications is not recommended from the AWS team.
- CDK team recommend using environment variables and context, which are resolved at synthesis time and can be used in our CDK code to conditionally provision / update resources.
- keep versions of all cdk components same
- cdk workflow: init ->> bootstrap ->> synth ->> deploy

  ### Resources
  - https://www.cdkday.com/
  - https://cdk.dev/
  - https://cdkpatterns.com/
  - https://garbe.io/blog/2019/09/11/hey-cdk-how-to-migrate/
  - https://github.com/kolomied/awesome-cdk
  - https://constructs.dev/
  - https://docs.aws.amazon.com/solutions/latest/constructs/walkthrough-part-1.html

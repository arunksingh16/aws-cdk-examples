


# Context in AWS CDK 
https://bobbyhadz.com/blog/how-to-use-context-aws-cdk
Context in CDK is a combination of key-value pairs we can set in our CDK application.

These key-value pairs are going to be available at synthesis time, which means that we can use them in our code, i.e. in conditional statements.

The CDK library uses context to:

cache information about the deployment environment - i.e. Availability zones
keep track of feature flags. Feature flags provide a way to opt in or out of new functionality that introduces breaking changes, outside of a major CDK version release.

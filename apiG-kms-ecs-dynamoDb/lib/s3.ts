import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";

export class S3Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for your artifacts
    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      bucketName: "my-bucket-frontend-7777",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: Set to RETAIN if you want to keep the bucket
      publicReadAccess: false, // Restrict public access by default
      autoDeleteObjects: true, // Automatically delete objects when the bucket is removed
    });

    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(path.resolve(__dirname, "../src/frontend"))],
      destinationBucket: artifactBucket,
    });

    const oia = new cloudfront.OriginAccessIdentity(this, "OAI", {
      comment: "Allows CloudFront to access the bucket",
    });

    artifactBucket.grantRead(oia);
    
    // Create a CloudFront distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        defaultRootObject: "index.html",
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: artifactBucket,
              originAccessIdentity: oia,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      },
    );
  }
}

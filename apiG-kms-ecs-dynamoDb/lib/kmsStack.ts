import { Duration, Stack, StackProps, App, RemovalPolicy } from "aws-cdk-lib";
import path = require("path");
import * as iam from "aws-cdk-lib/aws-iam";
import { Key, KeySpec, Alias } from "aws-cdk-lib/aws-kms";

export interface KMSStackProps extends StackProps {
  readonly keyAlias: string;
}

export class KMSStack extends Stack {
  public readonly key: Key;
  public readonly alias: Alias;

  constructor(scope: App, id: string, props?: KMSStackProps) {
    super(scope, id, props);

    const policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountRootPrincipal()],
          actions: ["kms:*"],
          resources: ["*"],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountRootPrincipal()],
          actions: ["kms:*"],
          resources: ["*"],
          conditions: {
            Bool: {
              "kms:GrantIsForAWSResource": "true",
            },
          },
        }),
      ],
    });

    this.key = new Key(this, `kms`, {
      removalPolicy: RemovalPolicy.DESTROY,
      pendingWindow: Duration.days(7),
      description: "Key For Enc Dec Operations",
      enableKeyRotation: true,
      //rotationPeriod: props.KEY_ROTATION,
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      // we can not use key id as it will regenerate when the key is rotated
      alias: `/poc/EncryptionKey`,
      /* 
        This policy grants permissions to the AWS root user (account owner) 
        and It allows the root user to perform all KMS actions (kms:*) on any KMS key (Resource: "*").
        */
      policy: policy,
    });
    this.alias = this.key.addAlias(`${props?.keyAlias}`);
  }
}

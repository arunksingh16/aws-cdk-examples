import { Duration, Stack, StackProps, App, RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface DynamoDBStackProps extends StackProps {
  readonly tableName: string;
  readonly partitionKey: dynamodb.Attribute;
  readonly timeToLiveAttribute?: string;
}

export class DynamoDBStack extends Stack {
  public readonly table: dynamodb.TableV2;
  constructor(scope: App, id: string, props?: DynamoDBStackProps) {
    super(scope, id, props);

    if (!props?.partitionKey) {
      throw new Error(
        "Partition key is not defined. Please provide a partition key for the table.",
      );
    }

    this.table = new dynamodb.TableV2(this, "Table", {
      tableName: props?.tableName,
      partitionKey: props?.partitionKey,
      timeToLiveAttribute: props?.timeToLiveAttribute,
      removalPolicy: RemovalPolicy.DESTROY,
      tableClass: dynamodb.TableClass.STANDARD,
    });
  }
}

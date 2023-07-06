import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ecsFargate } from  '../lib/constructs/ecsFargate';

export interface FargateProps extends cdk.NestedStackProps {
    readonly vpc: ec2.Vpc;
    environment: string;
    readonly taskMemLim: number;
    readonly taskCPU: number;
    //readonly roleFargate: iam.IRole;
  }
export class fargatestack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: FargateProps) {
    super(scope, id, props);

    const fargateStack = new ecsFargate(this, `${props.environment}-fargate`, {
        environment: 'development',
        vpc: props.vpc,
        taskMemLim: 512,
        taskCPU: 256,
        //roleFargate: fargateRole
      });   
    }
}

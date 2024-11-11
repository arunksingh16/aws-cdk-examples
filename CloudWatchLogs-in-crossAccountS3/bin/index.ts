#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StackA } from "../lib/stacka";
import { StackB } from "../lib/stackb";

const app = new cdk.App();

const envAccount1Region1 = {
  account: "<Source Account Number>",
  region: "eu-central-1",
};
const envAccount2Region2 = {
  account: "<Target Account Number>",
  region: "eu-central-1",
};

const stackb = new StackB(app, "StackB", {
  env: envAccount2Region2,
  source_accountID: envAccount1Region1.account,
});
new StackA(app, "StackA", {
  env: envAccount1Region1,
  destinationArn: stackb.destination.destinationArn,
});

#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { GlobalRekognitionCustomLabelsRegionalStack } from "../lib/regional-stack";
import { GlobalRekognitionCustomLabelsManagementStack } from "../lib/global-management-stack";
import * as s3 from "@aws-cdk/aws-s3";
import { GlobalModelStepFunctionStack } from "../lib/global-model-stepfunction-stack";

//Amazon Rekognition Custom Labels
//https://docs.aws.amazon.com/general/latest/gr/rekognition.html
/*const supportedRegions = [
  "us-east-1",
  "us-east-2",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
];*/
const supportedRegions = ["us-east-1", "us-east-2"];
const managementRegion = "us-east-1";

const app = new cdk.App();

const createRegionalStack = (
  region: string
): {
  region: string;
  stackName: string;
  stack: GlobalRekognitionCustomLabelsRegionalStack;
  trainingDataBucket: s3.Bucket;
  outputBucket: s3.Bucket;
} => {
  const stack = new GlobalRekognitionCustomLabelsRegionalStack(
    app,
    "GlobalRekognitionCustomLabelsStack-" + region,
    {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
      },
    }
  );
  return {
    region,
    stackName: stack.stackName,
    stack,
    trainingDataBucket: stack.trainingBucket,
    outputBucket: stack.outputBucket,
  };
};

const regionalStacks = supportedRegions.map(createRegionalStack);

const managementStack = new GlobalRekognitionCustomLabelsManagementStack(
  app,
  "GlobalRekognitionCustomLabelsManagementStack-" + managementRegion,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: managementRegion,
    },
    maximumModelBuildTime: 180, // in minute
    RegionalStacks: regionalStacks,
  }
);
regionalStacks.map((s) => managementStack.addDependency(s.stack));

const globalModelStepFunctionStack = new GlobalModelStepFunctionStack(
  app,
  "GlobalModelStepFunctionStack-" + managementRegion,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: managementRegion,
    },
    maximumModelBuildTime: 180, // in minute
    RegionalStacks: regionalStacks,
  }
);
regionalStacks.map((s) => globalModelStepFunctionStack.addDependency(s.stack));

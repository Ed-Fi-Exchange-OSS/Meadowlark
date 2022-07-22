# Meadowlark Remote Deployment

| ❗ AWS remote deployment is temporarily unavailable, because we have removed DynamoDB and have not yet scripted any deploy process for either MongoDB or PostgreSQL. |
| -- |

Meadowlark currently supports deployment to AWS. Remote deployment is performed
using the [Serverless Framework](https://www.serverless.com/framework/docs)
tool. Remote deployment does not require the local setup outlined in
[README.md](README.md).

## Getting Started

### Local Installation

* Install [Node.js 14.x](https://nodejs.org/en/download/releases/)
* Install [Yarn 1.x](https://classic.yarnpkg.com/lang/en/)

### Meadowlark API Security

Note: Meadowlark API security is in the proof-of-concept stage.

If you haven't already, copy the .env.example to a `.env.<stage>` file. For
example, if you wish to have a stage (aka environment) called "dev" in AWS:
`cp .env.example .env.dev`. There are two environment variables that deal with API
security. Both are used by an AWS deployment.

* `SIGNING_KEY` is a hardcoded (that is, _fake_) OAuth 2.0 key. The example key
  may be used for testing, or a new one can be generated via the `createKey`
  endpoint.
* `ACCESS_TOKEN_REQUIRED` controls whether Meadowlark requires a valid OAuth 2.0
  access token in the `Authorization` header, and is enabled by setting it to
  `true`. There are hardcoded credentials in the
  [HardcodedCredential](packages/meadowlark/src/security/HardcodedCredential.ts)
  file, and example generated tokens in the
  [local.token.http](packages/meadowlark/test/http/local.token.http) file.

### AWS Setup

Set up your environment for command-line interaction with AWS.

* Install the [AWS
  CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  if you don't already have it.
* Ensure that you have [configured your AWS CLI
  enviroment](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
  with your security credentials.
* Ensure that your ["default"
  profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
  is configured. This is the profile that Meadowlark will use.
* In the .env file, ensure that the lines for `AWS_ACCESS_KEY_ID` and
  `AWS_SECRET_ACCESS_KEY` are commented out if they exist.
* Setting up the right policies in AWS is not our expertise. For non-administrative
  users, we provided these policies, and they allowed developers to deploy out to AWS.
  Please review carefully before applying in your account.

**Policy: CreateMeadowlarkLambdaRole**
Replace "ACCOUNT_ID" below with your actual account id.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "apigateway:GET",
                "apigateway:PATCH",
                "apigateway:POST",
                "apigateway:PUT"
            ],
            "Resource": [
                "arn:aws:apigateway:us-east-1::/apis"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "apigateway:GET",
                "apigateway:PATCH",
                "apigateway:POST",
                "apigateway:PUT"
            ],
            "Resource": [
                "arn:aws:apigateway:us-east-1::/apis/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:CancelUpdateStack",
                "cloudformation:ContinueUpdateRollback",
                "cloudformation:CreateChangeSet",
                "cloudformation:CreateStack",
                "cloudformation:CreateUploadBucket",
                "cloudformation:DeleteStack",
                "cloudformation:Describe*",
                "cloudformation:EstimateTemplateCost",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:Get*",
                "cloudformation:List*",
                "cloudformation:UpdateStack",
                "cloudformation:UpdateTerminationProtection"
            ],
            "Resource": "arn:aws:cloudformation:us-east-1:ACCOUNT_ID:stack/edfi-meadowlark-*/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:ValidateTemplate"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:Describe*"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "events:Put*",
                "events:Describe*",
                "events:List*"
            ],
            "Resource": "arn:aws:events:us-east-1:ACCOUNT_ID:rule/edfi-meadowlark-*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:DeleteRolePolicy",
                "iam:DetachRolePolicy",
                "iam:GetRole",
                "iam:PassRole",
                "iam:PutRolePolicy"
            ],
            "Resource": [
                "arn:aws:iam::*:role/edfi-meadowlark-*-lambdaRole"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:*"
            ],
            "Resource": [
                "arn:aws:lambda:*:*:function:edfi-meadowlark-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:DescribeLogGroups"
            ],
            "Resource": "arn:aws:logs:us-east-1:ACCOUNT_ID:log-group::log-stream:*"
        },
        {
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogStreams",
                "logs:FilterLogEvents"
            ],
            "Resource": "arn:aws:logs:us-east-1:ACCOUNT_ID:log-group:/aws/lambda/edfi-meadowlark-*:log-stream:*",
            "Effect": "Allow"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:DeleteBucketPolicy",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion",
                "s3:Get*",
                "s3:List*",
                "s3:PutBucketNotification",
                "s3:PutBucketPolicy",
                "s3:PutBucketTagging",
                "s3:PutBucketWebsite",
                "s3:PutEncryptionConfiguration",
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::edfi-meadowlark-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:*"
            ],
            "Resource": [
                "arn:aws:s3:::edfi-meadowlark-*/*"
            ]
        }
    ]
}
```

### Deploy Meadowlark to AWS

The Meadowlark [package.json](packages/meadowlark/package.json) includes scripts
that use the [Serverless Framework](https://www.serverless.com/framework/docs)
tool to deploy to a stage in your AWS environment. These scripts may be run with
`npm` or `yarn` from the `packages/meadowlark` directory.

There are scripts to deploy to a "dev" stage and a "stg" stage. Note that
publishing to a stage overwrites any previous deployment to that stage.

The first publish of a stage may take 10-15 minutes to complete. This is the
time it takes for AWS to provision a new OpenSearch instance, so please be
patient. Follow-on deployments to the same stage will be much faster.

* Run `yarn deploy:aws dev` to deploy to the "dev" stage.
* Note the server portion of the endpoint URLs displayed at the end of the
  deployment process for access to the deployed API.

### Inspecting Meadowlark in AWS

Your deployed Meadowlark stack can be inspected in your
[CloudFormation](https://console.aws.amazon.com/cloudformation/home) console in
the AWS UI. Ensure that you have selected the AWS region matching your AWS CLI
environment setup. Meadowlark stacks are named with an `edfi-meadowlark` prefix
followed by the stage name. For example, a "dev" stage deployment will be named
`edfi-meadowlark-dev`. See the [Cloudformation
documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-view-stack-data-resources.html)
for information on using the console.

### Removing a Meadowlark Deployment

A Meadowlark deployment includes a large number of AWS resources which incur
costs while deployed. While a Meadowlark deployment may be deleted from AWS like
any other Cloudformation stack, the easiest way to remove one is via
package.json script.

* Run `yarn teardown:aws dev` to shut down running resources for the "dev" stage
  and delete the published stack from AWS.

### Load Ed-Fi Descriptors

Meadowlark is packaged with the full set of Ed-Fi descriptors which, while not
required, must be loaded in order to use descriptor validation.

* Run `yarn load:descriptors:aws dev` to invoke the Meadowlark Lambda function
  that loads descriptors into the "dev" stage. Be patient, as this may take up
  to 90 seconds to complete.

### Test a Meadowlark AWS Deployment

Meadowlark is bundled with test scripts to exercise the API. Similar to Postman,
these scripts are .http files that use the Visual Studio Code REST Client
extension.

* Install [Visual Studio Code](https://code.visualstudio.com/) and the [REST
  Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
  extension. In Visual Studio Code, open the Meadowlark-js folder.
* Open the
  [remote.deployment.test.http](packages/meadowlark/test/http/remote.deployment.test.http)
  file and update the @hostname entry to match your AWS deployment.
* Follow the directions to exercise your deployment with several API scenarios.

### Deploy Meadowlark to a Different Stage

The "dev" and "stg" stages are merely examples, and it is easy to deploy
Meadowlark to a different stage. An an example, for a stage named "prod":

* Run `yarn build` first to ensure you are deploying the latest transpiled code.
* Run `yarn deploy:aws prod`
  to deploy Meadowlark to the "prod" stage.
* Run `yarn teardown:aws prod` to remove Meadowlark from the "prod" stage.

### Monitoring

Logs are stored in CloudWatch, in the region used by the deployment. The default
configuration uses Virginia / US-EAST-1: [CloudWatch - Virginia - Filter on
Meadowlark](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups$3FlogGroupNameFilter$3Dmeadowlark).

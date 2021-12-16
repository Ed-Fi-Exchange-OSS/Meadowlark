# Meadowlark Local Development and Deployment

These are the instructions for setting up a local environment for Meadowlark
development and testing. These instructions are independent of remote
deployment. For remote deployment instructions, please see
[DEPLOYMENT.md](DEPLOYMENT.md).

## Getting Started

### Local Installation

* Install [Node.js 14.x](https://nodejs.org/en/download/releases/)
* Install [Yarn 1.x](https://classic.yarnpkg.com/lang/en/)
* Install [Visual Studio Code](https://code.visualstudio.com/)
* Install Java JRE version 11 or higher to run DynamoDB Local (Downloadable
  Version).
* Install the [AWS
  CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
  While the AWS CLI itself is required, you will not need an AWS account to run
  Meadowlark locally.

### Visual Studio Code

* Start Visual Studio Code and open the `meadowlark-js` directory.
* Install all extension recommendations.
* Open a terminal in the meadowlark-js directory and run `yarn install`.
  * Note that `yarn install` will add a git hook to run linters before pushing
    with git.

### Environment Variables

Meadowlark uses environment variables from a `.env` file for API security and
local DynamoDB and OpenSearch configuration. You will also need to set dummy
AWS credentials if you do not intend to deploy Meadowlark to an AWS account.

* In the `packages/meadowlark` directory, Copy the `.env.example` file to
  `.env`.
* Decide on a directory location for the DynamoDB Local data to be stored, and
  create that directory.
* Edit `.env` and set `DYNAMODB_DATA_DIR` to the directory you created.
* Disable the requirement for OAuth 2.0 access tokens by setting
  `ACCESS_TOKEN_REQUIRED` to `false`.
  * See [DEPLOYMENT.md](DEPLOYMENT.md) for more information on Meadowlark API
    security.
* The default values of the other variables should be fine.

If you do not intend to deploy Meadowlark to an AWS account and you do not
already have the AWS CLI configured, uncomment the `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY` lines. If you decide to configure the AWS CLI later (see
[DEPLOYMENT.md](DEPLOYMENT.md)), comment these lines out again.

### DynamoDB Local Installation

* Change directories to `packages/meadowlark`.
* Run `yarn init:local-dynamodb`.

### OpenSearch Installation

The quickest way to get OpenSearch running locally is with Docker. See the
[docker-local README.md](docker-local/readme.md) in the docker-local directory
for instructions.

### Test a local deploy

Meadowlark is bundled with test scripts to exercise the API. Similar to Postman,
these scripts are .http files that use the Visual Studio Code [REST
Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension.

* Run `yarn start:local`
* Use a test/http/local.*.http file to make API calls.
  * Reference validation can be disabled by adding the header
    `reference-validation: false`.
  * Descriptor validation can be disabled by adding the header
    `descriptor-validation: false`.

### Load Ed-Fi Descriptors

Meadowlark is packaged with the full set of Ed-Fi descriptors which, while not
required, must be loaded in order to use descriptor validation.

* Run `yarn start:local` in one shell.
* In a second shell, run `yarn load:descriptors:local` from
  `packages/meadowlark` to invoke the Meadowlark Lambda function that loads
  descriptors into the "dev" stage.

### Other Build Scripts

For other build / operation scripts, please review the [general
package.json](package.json) (repository-wide commands) file or the
[meadowlark-specific package.json](packages/meadowlark/package.json) (package
commands)

## Resources for Learning about DynamoDB

* Alex DeBrie's [DynamodDB Guide](https://www.dynamodbguide.com/) and [The
  DynamoDB Book](https://www.dynamodbbook.com/)
* [Single table design with
  DynamoDB](https://www.youtube.com/watch?v=BnDKD_Zv0og). "Covers a fair amount
  of his book content".
* [re:Invent 2019 - DynamoDB Deep
  Dive](https://www.youtube.com/watch?v=6yqfmXiZTlM)
* [re:Invent 2020 - DynamoDB Advanced Design Patterns, part
  1](https://www.youtube.com/watch?v=MF9a1UNOAQo)
* [re:Invent 2020 - DynamoDB Advanced Design Patterns, part
  2](https://www.youtube.com/watch?v=_KNrRdWD25M)

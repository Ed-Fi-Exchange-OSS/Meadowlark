# Meadowlark Local Development and Deployment

These are the instructions for setting up a local environment for Meadowlark
development and testing. These instructions are independent of remote
deployment. For remote deployment instructions, please see
[DEPLOYMENT.md](DEPLOYMENT.md).

## Getting Started

### Repo structure

Meadowlark-js is structured as a monorepo managed by Yarn and Lerna. There are three
directories that contain npm packages:

* `services`: The Meadowlark custom frontend runners, e.g. AWS API Gateway + Lambda,
   Ngnix + Fastify
* `backends`: The Meadowlark custom backend plugins providing primary data storage and
  reference validation e.g. MongoDB, PostgreSQL
* `packages`: The Meadowlark packages providing core functionality and libraries
  for the frontend and backend packages

The `docker` directory contains Docker Compose files supporting the frontends and backends.
The `test` directory contains test scripts to exercise the API. Similar to Postman,
these scripts are .http files that use the Visual Studio Code [REST
Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension.

### Local Installation

* Install [Node.js 16.x or higher](https://nodejs.org/en/download/releases/)
* Enable [Yarn](https://yarnpkg.com/getting-started/install) as the package manager
* (recommended editor) Install [Visual Studio Code](https://code.visualstudio.com/)
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

* In the `services/meadowlark-aws-lambda` directory, Copy the `.env.example` file to
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

* On the command line, enusure you are in the `services/meadowlark-aws-lambda` directory.
* Run `yarn init:local-dynamodb`.

### MongoDB and OpenSearch Installation

The quickest way to get OpenSearch running locally is with Docker. See the
[docker README.md](docker/readme.md) in the docker directory
for instructions.

### Test a local deploy

Meadowlark is bundled with test scripts to exercise the API.

* Run `yarn build` from the root `Meadowlark-js` directory.
* Run `yarn start:local` from the root `Meadowlark-js` directory.
* Use a test/http/local.*.http file to make API calls.
  * Reference validation can be disabled by adding the header
    `reference-validation: false`.

### Load Ed-Fi Descriptors

Meadowlark is packaged with the full set of Ed-Fi descriptors which, while not
required, must be loaded in order for descriptors to validate successfully.

* Run `yarn start:local` in one shell.
* In a second shell, run `yarn load:descriptors:local` to invoke the Meadowlark
* Lambda function that loads descriptors into the "dev" stage.

### Other Build Scripts

For other build / operation scripts, please review the [general
package.json](package.json) (repository-wide commands) file or the individual
package.json files in each package.

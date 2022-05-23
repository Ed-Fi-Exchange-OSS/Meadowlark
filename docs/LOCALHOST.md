# Running on Localhost

Instructions for running a local "developer" environment on localhost:

1. Install [Node.js 16.x or higher](https://nodejs.org/en/download/releases/)
2. Enable [Yarn](https://yarnpkg.com/getting-started/install) as the package manager
3. Install [Docker Desktop](https://www.docker.com)
4. Initialize a backend technology:
   * **DynamoDB**:
     1. Install Java JRE version 11 or higher to run DynamoDB Local
        (Downloadable Version).
     2. Install the [AWS
        CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
        While the AWS CLI itself is required, you will not need an AWS account
        to run Meadowlark locally.
     3. In the
        [meadowlark-aws-lambda](../Meadowlark-js/services/meadowlark-aws-lambda)
        directory, create a `.env` file (option: copy the existing
        `.env.example` file).
     4. Create a data directory for DynamoDB, somewhere outside of this
        repository.
     5. Enter the full path to that directory as the `DYNAMODB_DATA_DIR` value
        in the `.env` file.
     6. Run these commands:

        ```bash
        yarn install
        yarn init:init:local-dynamodb
        ```

   * **MongoDB**: Start a MongoDB cluster in Docker
     ([instructions](../docker/)).
   * **PostgreSQL**: Start PostgreSQL in Docker ([instructions](../docker/)).
5. Initialize OpenSearch by starting it up in Docker
   ([instructions](../docker/)).
6. Setup environment variables for running the
   [meadowlark-aws-lambda](../Meadowlark-js/services/meadowlark-aws-lambda)
   service.
   1. If not running DynamoDB, create a `.env` file in the service directory
      (option: copy the existing `.env.example` file).
   2. Review the settings in the example file to see what values, if any, to change.
   3. In particular, be sure to comment out or uncomment, as appropriate, the
      correct backend plugin.
   4. If you do not intend to deploy Meadowlark to an AWS account and you do not
      already have the AWS CLI configured, uncomment the `AWS_ACCESS_KEY_ID` and
      `AWS_SECRET_ACCESS_KEY` lines. If you decide to configure the AWS CLI
      later (see [DEPLOYMENT.md](DEPLOYMENT.md)), comment these lines out again.

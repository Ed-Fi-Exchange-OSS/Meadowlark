# Running on Localhost

Instructions for running a local "developer" environment on localhost:

1. Install [Node.js 16.x or higher](https://nodejs.org/en/download/releases/)
2. Enable [Yarn](https://yarnpkg.com/getting-started/install) as the package manager
3. Install [Docker Desktop](https://www.docker.com)
4. Initialize a backend technology:
   * **MongoDB**: Start a MongoDB cluster in Docker
     ([instructions](../docker/)).
   * **PostgreSQL**: Start PostgreSQL in Docker ([instructions](../docker/)).
5. Initialize OpenSearch by starting it up in Docker
   ([instructions](../docker/)).
6. Setup environment variables for running the
   [meadowlark-aws-lambda](../Meadowlark-js/services/meadowlark-aws-lambda)
   service.
   1. Review the settings in the example file to see what values, if any, to change.
   2. In particular, be sure to comment out or uncomment, as appropriate, the
      correct backend plugin.
   3. If you do not intend to deploy Meadowlark to an AWS account and you do not
      already have the AWS CLI configured, uncomment the `AWS_ACCESS_KEY_ID` and
      `AWS_SECRET_ACCESS_KEY` lines. If you decide to configure the AWS CLI
      later (see [DEPLOYMENT.md](DEPLOYMENT.md)), comment these lines out again.

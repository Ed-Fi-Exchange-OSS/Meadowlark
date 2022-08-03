# Running on Localhost

Instructions for running a local "developer" environment on localhost:

1. Install [Node.js 16.x or higher](https://nodejs.org/en/download/releases/)
2. Enable [Yarn](https://yarnpkg.com/getting-started/install) as the package manager
3. Install [Docker Desktop](https://www.docker.com)
4. Review the [General Docker Guidance](../Meadowlark-js/docker/using-docker.md) for Meadowlark
5. Initialize a backend technology:
   * **MongoDB**: Start a MongoDB cluster in Docker
     ([instructions](../Meadowlark-js/backends/meadowlark-mongodb-backend/docker/readme.md)).
   * **PostgreSQL**: Start PostgreSQL in Docker ([instructions](../Meadowlark-js/backends/meadowlark-postgresql-backend/docker/readme.md)).
6. Initialize OpenSearch by starting it up in Docker
   ([instructions](../Meadowlark-js/backends/meadowlark-opensearch-backend/docker/readme.md)).
7. Setup environment variables for running either the
   [meadowlark-aws-lambda](../Meadowlark-js/services/meadowlark-aws-lambda) or [meadowlark-fastify](../Meadowlark-js/services/meadowlark-fastify/)
   service. Each of the service folders has an example.env file tailored to that specific service, the easiest way to set your environment variables is to copy this file in the service folder and rename the file to .env
   1. Review the settings in the .env file to see what values, if any, to change. In particular:
      * DOCUMENT_STORE_PLUGIN - Make sure your chosen backend is uncommented and comment out the rest
      * QUERY_HANDLER_PLUGIN - Having this value uncommented allows for querying from Opensearch
      * LISTENER1_PLUGIN - Having this value uncommented will allow Meadowlark documents to flow to OpenSearch
   2. If you do not intend to deploy Meadowlark to an AWS account and you do not
      already have the AWS CLI configured, uncomment the `AWS_ACCESS_KEY_ID` and
      `AWS_SECRET_ACCESS_KEY` lines. If you decide to configure the AWS CLI
      later (see [DEPLOYMENT.md](DEPLOYMENT.md)), comment these lines out again.

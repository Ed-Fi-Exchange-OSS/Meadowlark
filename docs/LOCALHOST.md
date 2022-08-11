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
7. Setup environment variables for running [meadowlark-fastify](../Meadowlark-js/services/meadowlark-fastify/)
   service. The folder has an example.env file with all settings needed to run the service, the easiest way to set your environment variables is to duplicate this file in the folder and rename the file to .env
   1. Review the settings in the .env file to see what values, if any, to change. In particular:
      * DOCUMENT_STORE_PLUGIN - Make sure your chosen backend is uncommented and comment out the rest
      * QUERY_HANDLER_PLUGIN - Having this value uncommented allows for querying from Opensearch
      * LISTENER1_PLUGIN - Having this value uncommented will allow Meadowlark documents to flow to OpenSearch

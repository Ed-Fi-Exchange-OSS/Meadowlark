# Running on Localhost

Instructions for running a local "developer" environment on localhost:

1. Install [Node.js 16.x or higher](https://nodejs.org/en/download/releases/)
2. Enable [Yarn](https://yarnpkg.com/getting-started/install) as the package manager
3. Install [Docker Desktop](https://www.docker.com)
4. Review the [General Docker Guidance](../Meadowlark-js/docker/using-docker.md) for Meadowlark
5. The Meadowlark runtime currently requires running either PostgreSQL or
   MongoDB as the primary datastore, and OpenSearch as a secondary storage for
   high-performance queries. Before running the Meadowlark code, startup local
   instances of the data stores that you wish to use. The repository comes with
   Docker compose files for easily starting up all three. Either run
   `eng/docker.ps1` in PowerShell to start all three data stores at the same
   time (using default configuration), or see the individual directories if you
   wish to customize or to run `docker compose` directly in the directory
   containing the compose file:
   * [MongoDB](../Meadowlark-js/backends/meadowlark-mongodb-backend/docker)
   * [PostgreSQL](../Meadowlark-js/backends/meadowlark-postgresql-backend/docker)
   * [OpenSearch](../Meadowlark-js/backends/meadowlark-opensearch-backend/docker)
6. Setup environment variables for running
   [meadowlark-fastify](../Meadowlark-js/services/meadowlark-fastify/) service.
   The folder has an `example.env` file with all settings needed to run the
   service; the easiest way to set your environment variables is to duplicate
   this file in the folder and rename the file to `.env`. Review the settings in
   the `.env` file to see what values, if any, to change. In particular:
      * `DOCUMENT_STORE_PLUGIN` - Make sure your chosen backend is uncommented
        and comment out any others.
      * `QUERY_HANDLER_PLUGIN` and `LISTENER1_PLUGIN` - Uncomment these two for
        GET query support using OpenSearch.

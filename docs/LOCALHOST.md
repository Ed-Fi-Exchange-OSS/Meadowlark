# Running on Localhost

Instructions for running a local "developer" environment on localhost:

1. Install [Node.js 16.x](https://nodejs.org/en/download/releases/)
2. Install [Docker Desktop](https://www.docker.com)
3. Review the [Docker Guidance for Meadowlark](./DOCKER.md)
   to startup relevant backend services.
4. The Meadowlark runtime currently requires running either PostgreSQL or
   MongoDB as the primary datastore, and OpenSearch as a secondary storage for
   high-performance queries. Before running the Meadowlark code, startup local
   instances of the data stores that you wish to use. The repository comes with
   Docker compose files for easily starting up all three. Either run
   `eng/Run-DevContainers.ps1` in PowerShell to start all three data stores at the same
   time (using default configuration), or see the individual directories if you
   wish to customize or to run `docker compose` directly in the directory
   containing the compose file:
   * [MongoDB](../Meadowlark-js/backends/meadowlark-mongodb-backend/docker)
   * [PostgreSQL](../Meadowlark-js/backends/meadowlark-postgresql-backend/docker)
   * [OpenSearch](../Meadowlark-js/backends/meadowlark-opensearch-backend/docker)
   * [ElasticSearch](../Meadowlark-js/backends/meadowlark-elasticsearch-backend/docker)
5. Open a command prompt and navigate to the `/Meadowlark-js` folder
6. Run `npm install`
7. Run `npm run build`
8. Setup environment variables for running
   [meadowlark-fastify](../Meadowlark-js/services/meadowlark-fastify/readme.md) service.
9. Setup environment variables for OAuth. See [OAUTH2](OAUTH2.md) for more details.
10. Seup other environment variables. See [CONFIGURATION](CONFIGURATION.md) for more details.
11. Run `npm run start:local` to start the Meadowlark API service

## Clearing Out Local Databases

Sometimes it is useful to reset your local environment to a fresh state, with no
records. It is important to do this in all running backend data stores: MongoDB,
PostgreSQL, and OpenSearch. One mechanism is to stop the Docker containers and
then delete the volumes they were using, then restart Docker. If you do not want
to delete the volumes, then you can manually delete records. Examples:

### OpenSearch and ElasticSearch (Same commands work for both)

Open the [DevTools console](http://localhost:5601/app/dev_tools#/console) in a
browser and run these dangerous commands:

Delete all documents:

```none
POST */_delete_by_query
{
  "query": {
    "match_all": {}
  }
}
```

Delete all indices:

```none
DELETE *
```

### MongoDB

```none
db.getCollection('authorizations').deleteMany({});
db.getCollection('documents').deleteMany({});
```

### PostgreSQL

```sql
delete from meadowlark.documents;
delete from meadowlark.references;
delete from meadowlark.aliases;
delete from meadowlark.authorization;
```

## Running E2E Tests

### Setup

1. Create a .env file based on .env.example in this folder.
2. Verify that Docker is running

There are multiple ways of running e2e tests, depending on your scenario:

### Building local image

If you're adding new features to Meadowlark, and want to test the changes in an isolated environment, run `npm run test:e2e:build`.
This will build the Docker image and run the tests against that image, cleaning the environment afterwards.

### Using published image

If you want to run the tests against and existing Docker image, set the variable `API_IMAGE_NAME` in the .env file.
Run the tests with `npm run test:e2e:jest`.
This will pull the image and run the tests.

### Developer Mode

If you're adding new e2e tests or want to test in an environment without clearing the test images set the variable `DEVELOPER_MODE` to true in the .env file.
Run `test:e2e:dev:setup`, this will generate docker containers with the -test prefix that are used for testing.
Run the tests with `npm run test:e2e:jest`. Notice that you *could* use `npm run test:e2e:build` but the generated image will be ignored because the tests are already running.

> **Note**
>
> * This will use a locally built image or the image provided in the `API_IMAGE_NAME`.
> * This will generate an `ADMIN_KEY` and `ADMIN_SECRET` that can only be generated once, therefore, after the first run, this must be added to the .env variables.
>
> To exit this mode, run `test:e2e:dev:exit`. This will stop and delete the docker containers generated.

# Running on Localhost

Instructions for running a local "developer" environment on localhost:

1. Install [Node.js 18.x](https://nodejs.org/en/download/releases/)
2. Install [Docker Desktop](https://www.docker.com)
3. Review the [Docker Guidance for Meadowlark](./DOCKER.md) to startup relevant
   backend services.
4. The Meadowlark runtime currently requires running either PostgreSQL or
   MongoDB as the primary datastore, and OpenSearch or ElasticSearch as a
   secondary storage for high-performance queries. Before running the Meadowlark
   code, startup local instances of the data stores that you wish to use. The
   repository comes with Docker compose files for easily starting up all three.
   Either run `eng/Run-DevContainers.ps1` in PowerShell to start all three data
   stores at the same time (using default configuration), or see the individual
   directories if you wish to customize or to run `docker compose` directly in
   the directory containing the compose file:
   * [MongoDB](../Meadowlark-js/backends/meadowlark-mongodb-backend/docker)
   * [PostgreSQL](../Meadowlark-js/backends/meadowlark-postgresql-backend/docker)
   * [OpenSearch](../Meadowlark-js/backends/meadowlark-opensearch-backend/docker)
   * [ElasticSearch](../Meadowlark-js/backends/meadowlark-elasticsearch-backend/docker)
5. Open a command prompt and navigate to the `/Meadowlark-js` folder
6. Run `npm install`
7. Run `npm run build`
8. Setup environment variables for running
   [meadowlark-fastify](../Meadowlark-js/services/meadowlark-fastify/readme.md)
   service.
9. Setup environment variables for OAuth. See [OAUTH2](OAUTH2.md) for more
   details.
10. Seup other environment variables. See [CONFIGURATION](CONFIGURATION.md) for
    more details.
11. Run `npm run start:local` to start the Meadowlark API service

## Using Kafka

Alternatively, you can use Kafka and Kafka-connect to listen to MongoDB changes
and write them to OpenSearch (PostgreSQL and ElasticSearch are not supported at
the moment). To do so, run the
[Kafka](../Meadowlark-js/backends/meadowlark-kafka-stream/docker) setup and set
the `LISTENER1_PLUGIN` as an empty variable in the .env file.

## Clearing Out Local Databases

Sometimes it is useful to reset your local environment to a fresh state, with no
records. It is important to do this in all running backend data stores: MongoDB
or PostgreSQL, and OpenSearch or ElasticSearch. One mechanism is to stop the
Docker containers and then delete the volumes they were using, then restart
Docker. If you do not want to delete the volumes, then you can manually delete
records. Examples:

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

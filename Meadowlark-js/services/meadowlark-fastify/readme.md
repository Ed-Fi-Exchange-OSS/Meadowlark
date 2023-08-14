# Fastify for Meadowlark

Fastify is fast, low-overhead web framework for node-js. Fastify provides a local API layer for project Meadowlark.

Instructions for running a local "developer" environment:

1. Make a copy of [.env.example](.env.example) found in
    `/meadowlark-fastify` folder and rename the new file to `.env`, this will provide the environment
     variables that Meadowlark requires to run
1. Review the `.env` file and update any important settings. Pay attention, in particular to:
   * `DOCUMENT_STORE_PLUGIN` - The backend document store that Meadowlark will use
     * If using MongoDB set the value to `@edfi/meadowlark-mongodb-backend`
       * Update `MONGO_URI` to the location of your Mongo Instance
         * If running MongoDB via the local [docker compose configuration](../../docker-compose.yml),
           the default value for `MONGO_URI` is 
           `mongodb://mongo:abcdefgh1!@mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0`
     * If using PostgreSQL set the value to `@edfi/meadowlark-postgresql-backend`
       * Update `POSTGRES_USERNAME` and `POSTGRES_PASSWORD`
       * If your PostgreSQL instance is not running on the default port (5432), you can set `POSTGRES_PORT` to
         the port PostgreSQL is using
   * `QUERY_HANDLER_PLUGIN` and `LISTENER1_PLUGIN` - Uncomment these two for GET query support using OpenSearch
   * `AUTHORIZATION_STORE_PLUGIN` This is the plugin for the authorization store, it should be set to a NPM package name
     * To use the Meadowlark-js provided Authorization plugin, this should be set to `@edfi/meadowlark-mongodb-backend`
   * `OAUTH_SIGNING_KEY` - The `OAUTH_SIGNING_KEY` may need quotation marks around the value, unlike other keys.
   * Logging configuration, as this can affect performance. For better performance, avoid `debug` and `info` levels for `LOG_LEVEL`, and set `LOG_PRETTY_PRINT` to false. Rather than log to console, use `LOG_TO_FILE` set to true and set the log file directory with `LOG_FILE_LOCATION`.
1. If you have already built the Meadowlark-js project, you can skip to step 4, otherwise:
   * Open a command prompt and navigate to the `/Meadowlark-js` folder
   * Run `npm install`
   * Run `npm run build`
1. Open a command prompt and navigate to the `/Meadowlark-js/services/meadowlark-fastify` folder
1. Run `npm run start:local` to start the Fastify service
   * In another terminal, you can test connectivity with `curl http://localhost:3000/local/`
   * Also you can use the .http files that use the Visual Studio Code [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension, from the [`test` directory](../../tests/http/). You can try with the [33b test](../../tests/http/local.33b.http)

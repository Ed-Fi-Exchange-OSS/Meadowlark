# Fastify for Meadowlark

Fastify is fast, low-overhead web framework for node-js. Fastify provides a local API layer for project Meadowlark.

Instructions for running a local "developer" environment:

1. Make a copy of [.env.example](.env.example) found in
    `/Meadowlark-js/services/meadowlark-fastify` folder and rename the new file to `.env`, this will provide the environment
     variables that Meadowlark requires to run
2. Review the `.env` file and update any important settings. Pay attention, in particular to:
   * `DOCUMENT_STORE_PLUGIN` - The backend document store that Meadowlark will use
     * If using MongoDB `@edfi/meadowlark-mongodb-backend`
       * Update `MONGO_URL` to the location of your Mongo Instance
     * If using PostgreSQL `@edfi/meadowlark-postgresql-backend`
       * Update `POSTGRES_USERNAME` and `POSTGRES_PASSWORD`
       * If your PostgreSQL instance is not running on the default port (5432), you can set the `POSTGRES_PORT` variable
   * `QUERY_HANDLER_PLUGIN` and `LISTENER1_PLUGIN` - Uncomment these two for
        GET query support using OpenSearch
3. Open a command prompt and navigate to the `/Meadowlark-js/services/meadowlark-fastify` folder
4. Run `yarn start:local` to start the Fastify service

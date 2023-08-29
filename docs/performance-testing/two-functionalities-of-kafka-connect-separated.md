# RND-604: Separate kafka connect containers to separate sources from sink

## Goal

The debezium connect image has a list of sources to retrieve data from MongoDB, PostgreSQL
and other databases. The built image is adding a sink to write data to other sources,
and this can affect performance since the connector is both reading and writing data.

Evaluate if using two separate containers improves performance by having one container
that is only the Debezium connectors, and another container that is built on top of the
kafka connect image and adds the opensearch and elasticsearch connectors.

## Methodology

1. Before splitting the container functionality, start Meadowlark fully in Docker,
using MongoDB as the backend and OpenSearch as the search provider.

   ```pwsh
   cd Meadowlark-js
   ./reset-docker-compose.ps1
   ```

2. Bulk upload the "partial grand bend" data set, capturing the time taken.

   ```pwsh
   cd ../eng/performance
   .\BulkLoad-Performance.ps1 -Template "PartialGrandBend"
   ```

3. Repeat for a total of 5 measurements with the same settings
4. Repeat the measurement process.
5. Start everything over, do the 5 measurements after splitting the container functionality.

## Environment

The bulk load client runs on the host machine. It has 16 GB of RAM,
Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz   2.59 GHz processor, 6 cores and
12 logical processors, using WSL2. Docker has been configured to use 8GB of RAM
and 10 cores.

Baseline `.env` configuration file:

```none
OAUTH_SIGNING_KEY=<omitted>
OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH=meadowlark_verify-only_key_1
OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH=meadowlark_verify-only_secret_1
OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST=http://localhost:3000/local/oauth/token
OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION=http://localhost:3000/local/oauth/verify
OAUTH_HARD_CODED_CREDENTIALS_ENABLED=true

OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin
OPENSEARCH_ENDPOINT=http://opensearch-ml-local-node1:9200
OPENSEARCH_REQUEST_TIMEOUT=10000

AUTHORIZATION_STORE_PLUGIN=@edfi/meadowlark-mongodb-backend
DOCUMENT_STORE_PLUGIN=@edfi/meadowlark-mongodb-backend
QUERY_HANDLER_PLUGIN=@edfi/meadowlark-opensearch-backend
LISTENER1_PLUGIN=@edfi/meadowlark-opensearch-backend

MONGODB_USER=mongo
MONGODB_PASS=<omitted>
MONGO_URI=mongodb://${MONGODB_USER}:${MONGODB_PASS}@mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0&maxPoolSize=100

FASTIFY_RATE_LIMIT=false
FASTIFY_PORT=3000

FASTIFY_NUM_THREADS=4

MEADOWLARK_STAGE=local
LOG_LEVEL=warn
IS_LOCAL=true

BEGIN_ALLOWED_SCHOOL_YEAR=2022
END_ALLOWED_SCHOOL_YEAR=2035
ALLOW_TYPE_COERCION=true
ALLOW__EXT_PROPERTY=true

SAVE_LOG_TO_FILE=true
LOG_FILE_LOCATION=c:/temp/
```

## Results

| Scenario                                          | Avg      |
| ------------------------------------------------- | -------- |
| One container for source and sink                 | 2:39:647 |
| One container for source and another one for sink | 2:33:290 |

Given the results we got, there is a tiny improvement in performance when executed
the bulk load with 2 containers. Given these results we have decided to keep the code.

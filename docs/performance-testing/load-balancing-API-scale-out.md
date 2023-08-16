# RND-538: Load balancing API scale out

## Goal

Evaluate impact on application performance when scaling it out.

## Methodology

1. Start Meadowlark fully in Docker, using MongoDB as the backend and OpenSearch
   as the search provider.

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
4. Change the Fastify number of threads to 2 in the `.env` file.
5. Repeat the measurement process.
6. Start everything over, but this time without NGiNX load balancer.

## Environment

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
LOG_LEVEL=debug
IS_LOCAL=true

BEGIN_ALLOWED_SCHOOL_YEAR=2022
END_ALLOWED_SCHOOL_YEAR=2035
ALLOW_TYPE_COERCION=true
ALLOW__EXT_PROPERTY=true

SAVE_LOG_TO_FILE=true
LOG_FILE_LOCATION=c:/temp/
```

## Results

| Scenario                          | Avg          |
| --------------------------------- | ------------ |
| with load balancing, 4 threads    | 00:02:47.912 |
| with load balancing, 2 threads    | 00:02:29.008 |
| without load balancing, 4 threads | 00:02:28.290 |
| without load balancing, 2 threads | 00:02:32.296 |

## Raw Results

WITH LOADBALANCING:

FASTIFY_NUM_THREADS=4
	Total Time: 00:02:47.7064319
	Total Time: 00:02:37.4898545
	Total Time: 00:02:40.2312613
	Total Time: 00:02:35.9549423
	Total Time: 00:02:43.1832261

FASTIFY_NUM_THREADS=2
	Total Time: 00:02:30.5095058
	Total Time: 00:02:18.5902512
	Total Time: 00:02:26.0740558
	Total Time: 00:02:25.2780308
	Total Time: 00:02:44.5890730

WITHOUT LOADBALANCING:

FASTIFY_NUM_THREADS=4
	Total Time: 00:02:26.6134977
	Total Time: 00:02:28.2016753
	Total Time: 00:02:36.1254584
	Total Time: 00:02:29.2328461
	Total Time: 00:02:21.2826979

FASTIFY_NUM_THREADS=2
	Total Time: 00:02:29.0765482
	Total Time: 00:02:45.2344755
	Total Time: 00:02:26.9476904
	Total Time: 00:02:30.5897358
	Total Time: 00:02:39.6380510

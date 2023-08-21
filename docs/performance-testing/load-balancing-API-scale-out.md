# RND-538: Load balancing API scale out

## Goal

Evaluate impact on application performance when scaling it out.
We expect to get a better performance with the load balancer than without it.

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

| Scenario                          | Avg          |
| --------------------------------- | ------------ |
| with load balancing, 4 threads    | 00:02:47.912 |
| with load balancing, 2 threads    | 00:02:29.008 |
| with load balancing, 1 thread     | 00:02:40.449 |
| without load balancing, 4 threads | 00:02:28.290 |
| without load balancing, 2 threads | 00:02:32.296 |
| without load balancing, 1 thread  | 00:03:04.043 |

## Further analysis

Given that we did not see any improvement with the nginx load balancer, we decided to investigate
a little further, using this tool called [cadvisor](https://github.com/google/cadvisor) and
[mongodb compass](https://www.mongodb.com/products/compass).
We suspect that mongodb is causing the bottle neck.

| With load balancing and 4 Fastify threads    |              |
| -------------------------------------------- | ------------ |
| Meadowlark API                               | [Screenshot](./load-balancing-API-scale-out-screenshots/WithLB_4FastifyThreads/MeadowlarkAPI.jpg) |
| mongodb                                      | [Screenshot](./load-balancing-API-scale-out-screenshots/WithLB_4FastifyThreads/Mongo.jpg) |
| mongodb compass                              | [Screenshot](./load-balancing-API-scale-out-screenshots/WithLB_4FastifyThreads/mongo1_compass.jpg) |
| Overall                                      | [Screenshot](./load-balancing-API-scale-out-screenshots/WithLB_4FastifyThreads/Overall.jpg) |

| With load balancing and 1 Fastify threads    |              |
| -------------------------------------------- | ------------ |
| Meadowlark API                               | [Screenshot](./load-balancing-API-scale-out-screenshots/WithLB_1FastifyThreads/MeadowlarkAPI.jpg) |
| mongodb                                      | [Screenshot](./load-balancing-API-scale-out-screenshots/WithLB_1FastifyThreads/Mongo.jpg) |
| mongodb compass                              | [Screenshot](./load-balancing-API-scale-out-screenshots/WithLB_1FastifyThreads/mongo1_compass.jpg) |
| Overall                                      | [Screenshot](./load-balancing-API-scale-out-screenshots/WithLB_1FastifyThreads/Overall.jpg) |

| Without load balancing and 4 Fastify threads |              |
| -------------------------------------------- | ------------ |
| Meadowlark API                               | [Screenshot](./load-balancing-API-scale-out-screenshots/WithoutLB_4FastifyThreads/MeadowlarkAPI.jpg) |
| mongodb                                      | [Screenshot](./load-balancing-API-scale-out-screenshots/WithoutLB_4FastifyThreads/mongo.jpg) |
| mongodb compass                              | [Screenshot](./load-balancing-API-scale-out-screenshots/WithoutLB_4FastifyThreads/mongo1_compas.jpg) |
| Overall                                      | [Screenshot](./load-balancing-API-scale-out-screenshots/WithoutLB_4FastifyThreads/Overall.jpg) |

| Without load balancing and 1 Fastify threads |            |
| -------------------------------------------- | ------------ |
| Meadowlark API                               | [Screenshot](./load-balancing-API-scale-out-screenshots/WithoutLB_4FastifyThreads/MeadowlarkAPI.jpg) |
| mongodb                                      | [Screenshot](./load-balancing-API-scale-out-screenshots/WithoutLB_4FastifyThreads/mongo.jpg) |
| mongodb compass                              | [Screenshot](./load-balancing-API-scale-out-screenshots/WithoutLB_4FastifyThreads/mongo1_compas.jpg) |
| Overall                                      | [Screenshot](./load-balancing-API-scale-out-screenshots/WithoutLB_4FastifyThreads/Overall.jpg) |

Given the results we got with the tools indicated above, everything indicates that
MongoDB is the bottle neck we have, and the reason why we are not getting a
better performance with the load balancer.

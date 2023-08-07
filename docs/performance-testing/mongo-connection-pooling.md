# RND-380: MongoDB Connection Pooling

## Goal

Experiment with [MongoDB connection
pooling](https://www.mongodb.com/docs/drivers/node/v4.15/fundamentals/connection/connection-options/
) to evaluate impact on application performance.

## Methodology

1. Start Meadowlark fully in Docker, using MongoDB as the backend and OpenSearch
   as the search provider. (See below for environment settings).

   ```pwsh
   cd Meadowlark-js
   ./reset-docker-compose.ps1
   ```

2. Bulk upload the "partial grand bend" data set, capturing the time taken.

   ```pwsh
   cd ../eng/bulkLoad
   Measure-Command { .\Invoke-LoadPartialGrandBend.ps1 }
   ```

3. Repeat for a total of 5 measurements with the same settings
4. Tune the connection pooling via the `MONGO_URI` setting in the `.env` file.
5. Repeat the measurement process.

An Ed-Fi ODS/API v5.3-patch4 environment was configured on the same VM in order
to make a comparison between the two platforms. In this repository's
`eng/ods-api` directory, the reader will find a PowerShell script `reset.ps1`
that builds a fresh Docker container environment running the two Ed-Fi database
images and the API image. Since this is for raw testing and head-to-head
comparison, this solution does not use NGiNX or PG Bouncer. To run against the
ODS/API, alter step 2 above to use `Invoke-LoadPartialGrandbend-ODSAPI.ps1`

## Environment

All tests run on a Windows Server 2019 virtual machine as Docker host, running
the latest version of Docker Desktop, using WSL2. The VM has 12 cores assigned
to it using Intel Xeon Gold 6150 @ 2.70 GHz with 24.0 GB of memory and plenty of
disk space. Docker is configured to use up to 8 CPUs, 12  GB of memory, 2 GB of
swap space, and limit of 64 GB on virtual disk.

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
OPENSEARCH_ENDPOINT=http://localhost:9200
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
# Next line commented out, therefore it will auto-cluster to match number of
# available CPUs.
# FASTIFY_NUM_THREADS=4

MEADOWLARK_STAGE=local
LOG_LEVEL=debug
IS_LOCAL=true

BEGIN_ALLOWED_SCHOOL_YEAR=2022
END_ALLOWED_SCHOOL_YEAR=2034
ALLOW_TYPE_COERCION=true
ALLOW__EXT_PROPERTY=true

SAVE_LOG_TO_FILE=true
LOG_FILE_LOCATION=c:/temp/
```

The API bulk client loader runs on the VM host, connecting to the Docker
network. It is configured to use maximum of 100 connections, 50 tasks buffered,
and 500 max simultaneous requests. Retries are disabled. All of the XML files
load without error at this time.

## Results

Times below are given in seconds. In the default settings, there was one extreme
outlier that significantly impacted the average time, as seen by the high
standard deviation.

| Scenario                 | Avg    | St Dev |
| ------------------------ | ------ | ------ |
| 8 threads, pool size 1   | 182.04 | 17.33  |
| 8 threads, pool size 5   | 169.55 | 9.01   |
| 8 threads, pool size 100 | 173.27 | 9.04   |
| 8 threads, pool size 150 | 166.23 | 13.44  |
| 1 threads, pool size 1   | 536.75 | 9.39   |
| 1 threads, pool size 150 | 367.13 | 8.84   |
| 4 threads, pool size 150 | 166.06 | 10.18  |
| ODS/API                  | 89.20  | 4.32   |

See [RND-380.csv](RND-38.csv) for raw data.

## Analysis

In the default configuration, the Meadowlark API startup process forks itself as
many times as there are CPU's available. Thus, in default settings, there are
eight API processes running in parallel. Although these were initiated by the
same NodeJs process, each process is isolated with respect to memory. Thus, each
of the eight processes has a separate pool of connections. Within each forked
process there is still potential for connection pool re-use, thanks to the use
of asynchronous processing. However, it is clear that the connection pool
settings have little impact compared to the threading. Even a pool size of five
proved adequate when running with eight CPUs. Interestingly, the pool size of
150 with only four CPU's also yields consistent results compared to the tests
with eight CPU's.

The only time we see a discernible difference in results is when we reduce the
number of threads used by the API (`FASTIFY_NUM_THREADS`). For this data set,
the performance is discernibly worse with only one thread, whether using one or
150 connections in the pool. However, the connection pooling in such a low CPU
scenario does clearly yield an improved experience, reducing the average time to
complete the test by roughly 69%.

> **Note** Five executions of each test appears to be useful, but where timings
> are very close to one another, the number of data points is insufficient for
> giving a useful statistical significance.

The difference between Meadowlark and the ODS/API is obviously significant: the
ODS/API is almost 50% faster.

## Conclusions

Under the environment conditions described above, this research spike does not
find significant benefit to tuning the size of the MongoDB connection pool,
given there are at least four process threads running.

If a Meadowlark API container has only one or two virtual CPUs available, then
tuning the connection pooling could theoretically be beneficial. However, out of
the box, the MongoDB client has a default value of 100 connections available,
which may be appropriate for many situations.

Those with expertise in MongoDB might find that there are other connection pool
settings, such as timeouts, that could be relevant for a given situation.

# Configuration

## Services and Network Topology

As of release 0.3.0, "Meadowlark" provides a Fastify-based API that implements (imperfectly) an Ed-Fi API compliant with Data
Standard 3.3, and implements an OAuth2 API supporting the client-credentials flow. These services are backed by MongoDB for
primary data storage. The Ed-Fi API also includes OpenSearch and ElasticSearch to handle `GET` all items and `GET` by
querystring filters.

The MongoDB configuration needs to have a replica set to support atomic transactions. Technically the replica set can contain
only a single node, though we recommend at least three nodes. OpenSearch clustering has not been tested, and the development
team does not yet know how clustering works with this tool.

Ideally, all three services would be in the same network segment and able to communicate through unencrypted channels. Indeed,
the development team has not tested any alternative. However, only the API port should be open to outside traffic, except as
needed for debugging.

                       ┌────────────────────────────────────────────────────────┐
                       │                                                        │
                       │                      ┌────────┐                        │
                       │               ┌──────►MongoDB ├───────┐                │
                       │               │      └───┬────┘       │                │
    ┌───────────┐      │ ┌────────┐    │          │            │                │
    │API Clients├──────┼─►Fastify ├────┤      ┌───▼────┐  ┌────▼───┐            │
    └───────────┘      │ └────────┘    │      │MongoDB │  │MongoDB │            │
                       │               │      └────────┘  └────────┘            │
                       │               │                                        │
                       │               │      ┌───────────┐     ┌──────────────┐│
                       │               └──────►OpenSearch │ --- │ElasticSearch ││
                       │                      └───────────┘     └──────────────┘│
                       │                                                        │
                       │                                      Network Boundary  │
                       └────────────────────────────────────────────────────────┘

## Environment Variables

Meadowlark has a wealth of configuration options for fine tuning a deployment. At this time, they are all set via environment
variable, though many of them have sensible default values. The variables are grouped below by category to help the page
remain readable and to aid in searching out specific areas for configuration.

Required configuration values are in bold.

### Database Connectivity

:exclamation: Note: PostgreSQL as an alternative to MongoDB is not supported in release 0.3.0.

| Name                       | Default    | Explanation                                                                                                                            |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| MEADOWLARK_DATABASE_NAME   | meadowlark | For both MongoDB and PostgreSQL                                                                                                        |
| **MONGO_URI**                  | (none)     | [Connection string URI](https://www.mongodb.com/docs/v4.0/reference/connection-string/) for accessing a MongoDB 4.0-compatible service |
| MONGODB_MAX_NUMBER_OF_RETRIES  | 1     | Meadowlark can be configured to retry on MongoDB failure, for example when two concurrent transactions attempt to access the same resource. By default, Meadowlark will retry once. This can be changed with the MONGODB_MAX_NUMBER_OF_RETRIES environment variable. |
| MONGO_WRITE_CONCERN        | majority   | See [MongoDB: Write Concern](https://www.mongodb.com/docs/v4.0/reference/write-concern/)                                               |
| MONGO_READ_CONCERN         | majority   | See [MongoDB: Read Concern](https://www.mongodb.com/docs/v4.0/reference/read-concern/)                                                 |
| **OPENSEARCH_ENDPOINT**    | (none)     | Only required when the OpenSearch listener is configured for Fastify. Example: "http://localhost:9200"                                 |
| OPENSEARCH_USERNAME        | x          | Username for connecting to OpenSearch                                                                                                  |
| OPENSEARCH_PASSWORD        | y          | Password for connecting to OpenSearch                                                                                                  |
| OPENSEARCH_REQUEST_TIMEOUT | 30000      | In milliseconds                                                                                                                        |
| **ELASTICSEARCH_ENDPOINT**    | (none)     | Only required when the ElasticSearch listener is configured for Fastify.                |
| ELASTICSEARCH_REQUEST_TIMEOUT | 30000      | In milliseconds                                                                                                                        |
| POSTGRES_HOST              | localhost  | Server/host name for PostgreSQL                                                                                                        |
| POSTGRES_PORT              | 5432       | Port number for PostgreSQL                                                                                                             |
| POSTGRES_USER              | (none)     | Username for accessing PostgreSQL                                                                                                      |
| POSTGRES_PASSWORD          | (none)     | Password for accessing PostgreSQL                                                                                                      |

### OAuth2 Provider

| Name                     | Default                  | Explanation                                         |
| ------------------------ | ------------------------ | --------------------------------------------------- |
| **OAUTH_SIGNING_KEY**    | (none)                   | OAuth 2.0 signing key, base 64 encoded, 256 bit key |
| OAUTH_EXPIRATION_MINUTES | 60                       | Token expiration time in minutes                    |
| OAUTH_TOKEN_ISSUER       | edfi-meadowlark-issuer   | Token issuer                                        |
| OAUTH_TOKEN_AUDIENCE     | edfi-meadowlark-audience | Token audience                                      |

To create a new key:

* Try running the application and accessing endpoint `/{stage}/createSigningKey`
* Or run `openssl rand -base64 256` from a bash terminal shell.

### Fastify API

| Name                                             | Default                          | Explanation                                                                                              |
| ------------------------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| FASTIFY_NUM_THREADS                              | # of available CPUs              | Number of parallel Fastify threads to run                                                                |
| FASTIFY_PORT                                     | 3000                             | Port number for the API service                                                                          |
| FASTIFY_RATE_LIMIT                               | 0                                | Disabled when zero; otherwise limits a client to this number of requests per minute                      |
| HTTP_PROTOCOL_AND_SERVER                         | http://localhost                 | The base URL for the site                                                                                |
| MEADOWLARK_STAGE                                 | local                            | Used in the URL                                                                                          |
| DISABLE_LOG_ANONYMIZATION                        | false                            | When true, request and response logs will contain complete payloads instead of anonymized payloads       |
| LISTENER1_PLUGIN                                 | (none)                           | "@edfi/meadowlark-opensearch-backend" or "@edfi/meadowlark-elasticsearch-backend"; if not set, `GET` queries will fail |
| LISTENER2_PLUGIN                                 | (none)                           | No options at this time                                                                                  |
| QUERY_HANDLER_PLUGIN                             | (none)                           | "@edfi/meadowlark-opensearch-backend" or "@edfi/meadowlark-elasticsearch-backend"; if not set, `GET` queries will fail |
| DOCUMENT_STORE_PLUGIN                            | @edfi/meadowlark-mongodb-backend | Future alternative: "@edfi/meadowlark-postgresql-back                                                    |
| AUTHORIZATION_STORE_PLUGIN                   | @edfi/meadowlark-mongodb-backend | No alternative at this time.                                                                             |
| **OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST**  | (none)                           | Ex: http://localhost:3000/local/oauth/token                                                              |
| **OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION** | (none)                           | Ex: http://localhost:3000/local/oauth/verify                                                             |
| **OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH**          | (none)                           | Client ID with role "verify-only"                                                                        |
| **OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH**      | (none)                           | Client Secret                                                                                            |
| OAUTH_HARD_CODED_CREDENTIALS_ENABLED             | false                            | Allow use of hard-coded tokens for bootstrapping startup of a new system or test automation              |
| OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL            | 300000                           | Length of time in milliseconds to cache verified tokens, avoiding extra calls to the OAuth2 provider     |
| OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES    | 1000                             | Control the size of the token cache                                                                      |
| IS_LOCAL                                         | true                             | When true, prints plain text logs. Else prints structured JSON logs                                      |
| LOG_LEVEL                                        | info                             | Options: error, warn, info, debug                                                                        |
| SAVE_LOG_TO_FILE                                 | false                            | When true, save log messages to a file in addition to writing to the console                       |
| LOG_FILE_LOCATION                                 | /var/log/                           | Location of log file if SAVE_LOG_TO_FILE is enabled                       |
| ALLOW_TYPE_COERCION                              | false                            | When true, numbers send as strings (e.g. "1") will be accepted in validation                             |
| ALLOW__EXT_PROPERTY                              | false                            | When true, a payload may contain the `_ext` property without causing a validation error                  |
| **BEGIN_ALLOWED_SCHOOL_YEAR**                    | 1900                             | The beginning of the range of valid school years                                                         |
| **END_ALLOWED_SCHOOL_YEAR**                      | 2100                             | THe end of the range of valid school years                                                               |

### Hard-coded tokens

| Client ID                    | Client Secret                   | Roles       | Purpose                                                      |
| ---------------------------- | ------------------------------- | ----------- | ------------------------------------------------------------ |
| meadowlark_admin_key_1       | meadowlark_admin_secret_1       | admin       | Create additional clients                                    |
| meadowlark_verify-only_key_1 | meadowlark_verify-only_secret_1 | verify-only | Allow the API to call the OAuth2 token verification endpoint |

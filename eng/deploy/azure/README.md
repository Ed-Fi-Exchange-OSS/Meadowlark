# Azure Deployment

To deploy to Azure, this can be done thorough Azure Container Instances (ACI) deploying with the [Azure
CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) or with the [Docker Azure
Integration](https://docs.docker.com/cloud/aci-integration/).

## Deploy with Azure CLI

For Azure CLI, it's necessary to specify all environment variables in the command line since it is not possible to read a
.env file. Additionally, it is not possible to add all containers into the same container group, it must be one container per
group.

```pwsh
# Login to Azure
az login

$resourceGroup={resource group name}

# The combination of DNS labels and azure regions must be globally unique.
$meadowlarkDnsLabel={meadowlark dns}
$mongoDnsLabel={mongo dns}
$openSearchDnsLabel={opensearch dns}

# Create the mongo container
az container create --resource-group $resourceGroup -n ml-mongo `
    --image edfialliance/meadowlark-mongo:latest `
    --ports 27017 --dns-name-label $mongoDnsLabel `
    --command-line "mongod --bind_ip_all --replSet rs0"

# Initialize mongodb replica set
az container exec --resource-group $resourceGroup -n ml-mongo `
    --container-name ml-mongo --exec-command 'mongo --eval rs.initiate()'

# Create OpenSearch container
az container create --resource-group $resourceGroup -n ml-opensearch `
    --image edfialliance/meadowlark-opensearch:latest `
    --ports 9200 --dns-name-label $openSearchDnsLabel

# Define variables
# Replace with signing key
$signingKey="<run `openssl rand -base64 256` to create a key>"
$mongoUri='"mongodb://'+$mongoDnsLabel+'.southcentralus.azurecontainer.io:27017/?replicaSet=rs0&directConnection=true"'
$openSearchUrl="http://${openSearchDnsLabel}.southcentralus.azurecontainer.io:9200"
$documentStore="@edfi/meadowlark-mongodb-backend"
$queryHandler="@edfi/meadowlark-opensearch-backend"
$listenerPlugin="@edfi/meadowlark-opensearch-backend"
$authorizationPlugin="@edfi/meadowlark-mongodb-backend"

# Create meadowlark container
az container create --resource-group $resourceGroup -n ml-api `
    --image edfialliance/meadowlark-ed-fi-api:pre --ports 3000 `
    --dns-name-label $meadowlarkDnsLabel `
    --environment-variables OAUTH_SIGNING_KEY=$signingKey `OAUTH_HARD_CODED_CREDENTIALS_ENABLED=true `
    OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH=meadowlark_verify-only_key_1 `
    OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH=meadowlark_verify-only_secret_1 `
    OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST=http://${meadowlarkDnsLabel}.southcentralus.azurecontainer.io:3000/stg/oauth/token `
    OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION=http://${meadowlarkDnsLabel}.southcentralus.azurecontainer.io:3000/stg/oauth/verify `
    OPENSEARCH_USERNAME=admin OPENSEARCH_PASSWORD=admin OPENSEARCH_ENDPOINT=$openSearchUrl OPENSEARCH_REQUEST_TIMEOUT=10000 `
    DOCUMENT_STORE_PLUGIN=$documentStore QUERY_HANDLER_PLUGIN=$queryHandler LISTENER1_PLUGIN=$listenerPlugin `
    FASTIFY_RATE_LIMIT=false FASTIFY_PORT=3000 FASTIFY_NUM_THREADS=10 MEADOWLARK_STAGE=stg `
    LOG_LEVEL=info IS_LOCAL=false AUTHORIZATION_STORE_PLUGIN=$authorizationPlugin `
    BEGIN_ALLOWED_SCHOOL_YEAR=2022 END_ALLOWED_SCHOOL_YEAR=2034 ALLOW_TYPE_COERCION=true `
    ALLOW__EXT_PROPERTY=true MONGO_URI=$mongoUri
```

## Deploy with Docker Azure Integration

> **Warning** The Docker Azure Integration will be retired in November 2023.

- [Log into Azure from Docker](https://docs.docker.com/cloud/aci-integration/#log-into-azure).

- [Create an ACI Docker context](https://docs.docker.com/cloud/aci-integration/#create-an-aci-context)

- Browse to `../eng/deploy/azure`

- Create a .env file. Set the OAUTH_SIGNING_KEY, AZURE_REGION and ED_FI_DOMAIN_NAME. The combination of domain name an azure
  region must be globally unique.

- Execute the following script:

```Shell

# Switch to the ACI Context
docker context use myacicontext

docker compose -p meadowlark --file ./azure-docker-compose.yml up -d

# Initialize replica set
az container exec --resource-group {resource group name} -n meadowlark `
   --container-name ml-mongo1 --exec-command 'mongo --eval rs.initiate()'

```

> **Note** Not all functionality available in a Docker Compose file is available when deploying to ACI. To review the
> available features, check [the documentation](https://docs.docker.com/cloud/aci-compose-features/) .

### Removing the containers

Given that `docker compose down` is not available. To remove all the containers in the group, execute:

```Shell
az container delete --resource-group {resource group name} -n meadowlark
```

> **Warning** Not ready for production usage. This example is using a single mongo node with a simulated replica set and
> bypassing security with a direct connection, also, it's using the OAUTH hardcoded credentials. The current configuration is
> initializing the mongo replica manually, and this is not saved. Therefore, if the container instance is stopped, it's
> necessary to reinitialize the replica set.

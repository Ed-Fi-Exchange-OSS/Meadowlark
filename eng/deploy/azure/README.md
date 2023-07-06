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

```

> **Note** See [Enable Logging](#enable-logging) before setting up meadowlark container if you want to get log information.

```pwsh

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

### Enable Logging

To save the logs to a file, for a summarized result, set the flag `SAVE_LOG_TO_FILE` to true, which will create a
`meadowlark.log` file with the logs.

For a production deployment, it's recommended to send the logs to _Log Analytics_, with the following steps:

```pwsh
  # Create workspace
  az monitor log-analytics workspace create `
  --resource-group $resourceGroup --workspace-name meadowlark-logs
```

Copy the `customerId` from the result.

```pwsh
  # Get shared key
  az monitor log-analytics workspace get-shared-keys `
  --resource-group $resourceGroup --workspace-name meadowlark-logs
```

Copy the `primarySharedKey` from the result.

> **Note** This information can be retrieved from the Portal, in Log Analytics Workspaces -> Settings -> Agents. [More
> information](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-log-analytics#get-log-analytics-credentials)

When creating the **meadowlark container**, include the customerId (workspace_id) and the primarySharedKey (workspace_key) as
additional properties with the following flags:

```pwsh
az container create ... `
    --log-analytics-workspace <WORKSPACE_ID> `
    --log-analytics-workspace-key <WORKSPACE_KEY>
```

To view the log information, follow [these
steps](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-log-analytics#view-logs)

## Deploy with Docker Azure Integration

> **Warning** The Docker Azure Integration will be retired in November 2023.

- [Log into Azure from Docker](https://docs.docker.com/cloud/aci-integration/#log-into-azure).

- [Create an ACI Docker context](https://docs.docker.com/cloud/aci-integration/#create-an-aci-context)

- Browse to `../eng/deploy/azure`

- Create a .env file. Set the OAUTH_SIGNING_KEY, AZURE_REGION and ED_FI_DOMAIN_NAME. The combination of domain name an azure
  region must be globally unique.

- Execute the following script:

```pwsh

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

```pwsh
az container delete --resource-group {resource group name} -n meadowlark
```

## Test your deployment

To verify your deployment, run:

```pwsh
curl http://$meadowlarkDnsLabel.southcentralus.azurecontainer.io:3000/stg | ConvertFrom-Json | ConvertTo-Json
```

This will output the summary of the deployment

> **Warning** Not ready for production usage. This example is using a single mongo node with a simulated replica set and
> bypassing security with a direct connection, also, it's using the OAUTH hardcoded credentials. The current configuration is
> initializing the mongo replica manually, and this is not saved. Therefore, if the container instance is stopped, it's
> necessary to reinitialize the replica set.

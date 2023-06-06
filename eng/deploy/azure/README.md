# Azure Deployment

To deploy to Azure, this can be done through Azure Container Instances (ACI),
with the [Docker Azure
Integration](https://docs.docker.com/cloud/aci-integration/), or with [Azure
CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).

## Deploy with Docker Azure Integration

- [Log into Azure from
  Docker](https://docs.docker.com/cloud/aci-integration/#log-into-azure).

- [Create an ACI Docker
  context](https://docs.docker.com/cloud/aci-integration/#create-an-aci-context)

- Browse to `../eng/deploy/azure`

- Create a .env file. Update URLs to match your correct Azure region.

- Execute the following script:

```Shell

# Switch to the ACI Context
docker context use myacicontext

docker compose -p meadowlark --file ./azure-docker-compose.yml up -d

# Initialize replica set
az container exec --resource-group {resource group name} -n meadowlark `
   --container-name ml-mongo1 --exec-command 'mongo --eval rs.initiate()'

```

> **Note** Not all functionality available in a Docker Compose file is available
> when deploying to ACI. To review the available features, check [the
> documentation](https://docs.docker.com/cloud/aci-compose-features/) .

### Removing the containers

Given that `docker compose down` is not available. To remove all the containers
in the group, execute:

```Shell
az container delete --resource-group {resource group name} -n meadowlark
```

## Deploy with Azure CLI

For Azure CLI, it's necessary to specify all environment variables in the
command line since it is not possible to read a .env file. Additionally, it is
not possible to add all containers into the same container group, it must be one
container per group.

```Shell
# Login to Azure
az login

# Create the mongo container
az container create --resource-group {resource group name} -n ml-mongo `
    --image edfialliance/meadowlark-mongo:latest `
    --ports 27017 --dns-name-label mlmongo1 `
    --command-line "mongod --replSet rs0"

# Initialize mongodb replica set
az container exec --resource-group {resource group name} -n ml-mongo `
    --container-name ml-mongo --exec-command 'mongo --eval rs.initiate()'

# Create OpenSearch container
az container create --resource-group {resource group name} -n ml-opensearch `
    --image edfialliance/meadowlark-opensearch:latest `
    --ports 9200 --dns-name-label ml-opensearch

# Create meadowlark container
az container create --resource-group {resource group name} -n ml-api `
    --image edfialliance/meadowlark-ed-fi-api:pre --ports 80 `
    --environment-variables {specify all env variables required}
```

> **Warning** Not ready for production usage. This example is using a single
> mongo node with a simulated replica set and bypassing security with a direct
> connection, also, it's using the OAUTH hardcoded credentials. The current
> configuration is initializing the mongo replica manually, and this is not
> saved. Therefore, if the container instance is stopped, it's necessary to
> reinitialize the replica set.

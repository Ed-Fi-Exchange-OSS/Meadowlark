# Azure Deployment

To deploy to Azure, this can be done through Azure Container Instances (ACI), with the [Docker Azure Integration](https://docs.docker.com/cloud/aci-integration/), or with [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).

## Docker Azure Integration

1. [Log into Azure from Docker](https://docs.docker.com/cloud/aci-integration/#log-into-azure).
2. [Create an ACI Docker context](https://docs.docker.com/cloud/aci-integration/#create-an-aci-context)
3. Switch to the ACI Context `docker context use myacicontext`
4. Browse to the deploys folder `cd /deploys`
5. Create a .env file, base on .env.example inside /deploys.
Update URLs to match your correct Azure region.
6. Run `docker compose -p meadowlark --file ./azure-docker-compose.yml up -d`
7. Initialize mongodb replica set `az container exec --resource-group {resource group name} -n meadowlark --container-name ml-mongo1 --exec-command 'mongo --eval rs.initiate()'`

## Azure CLI

For Azure CLI, it's necessary to specify all environment variables in the command line since it is not possible to read a .env file.

1. Login to Azure.
2. Create the mongo container `az container create --resource-group {resource group name} -n ml-mongo --image mongo:4.0.28 --ports 27017 --dns-name-label mlmongo1 --command-line "mongod --replSet rs0"`
3. Initialize mongodb replica set `az container exec --resource-group {resource group name} -n meadowlark --container-name ml-mongo1 --exec-command 'mongo --eval rs.initiate()'`
4. Create meadowlark container `az container create --resource-group {resource group name} -n meadowlark --image edfialliance/meadowlark-ed-fi-api:pre --ports 80 --environment-variables {specify all environment variables required}`

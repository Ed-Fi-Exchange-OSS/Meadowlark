# Running Meadowlark in Azure Container Instances (ACI)

This solution uses
[docker-compose-azure.yml](../Meadowlark-js/docker-compose-azure.yml) to standup
a full environment. This solution is not recommended for production use, as it
is not tuned for high security or optimal performance. You must have a recent
version of Docker Desktop (Windows and MacOS) or the Docker Compose CLI for
Linux.

## Preparing the Azure Environment

You will need a writeable [Azure File
Share](https://learn.microsoft.com/en-us/azure/storage/files/) storage account
for volume storage, and it may be convenient to put this in the same resource
group as the containers you'll be creating.

One can create both of these manually in the [Azure
Portal](https://portal.azure.com), or use the [Azure
CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) on the
localhost.

<table>
<tr>
<th>💡</th>
<th>Windows tips</th>
</tr>
<tr>
<td></td>
<td>

All of the commands below use Bash, not PowerShell. Please use WSL1 or WSL2's
Bash prompt, not the one provided by Git. If using WSl1, first run `alias
docker=docker.exe`, because `docker` is likely not in the path.

You can use `winget install -e --id Microsoft.AzureCLI` to install the Azure tools in Windows.

If installing on a corporate network that performs man-in-the-middle decryption
for inspecting network traffic, then you will need to disable winget's
certificate validation process using `winget settings --enable
BypassCertificatePinningForMicrosoftStore` as discussed [in this
ticket](https://github.com/microsoft/winget-cli/issues/2879).

Again, in that corporate network situation, you may run into a difficulty when
trying to sign in from the command line, using both `az` and `docker`: the login
willopen a webpage on Azure for authentication, then will try to redirect you to
a URL on localhost, using `https`. If this fails, simply reload the URL using
`http` instead of `https`.

The Azure Container Registry commands (ACR) in theory should work if you use the
`$env:REQUESTS_CA_BUNDLE` to set a path to the correct certificates. Stephen did
not have success with that, and instead had to paste the certificates into
`C:\Program Files (x86)\Microsoft
SDKs\Azure\CLI2\Lib\site-packages\certifi\cacert.pem` as described in [Work
behind a
proxy](https://learn.microsoft.com/en-us/cli/azure/use-cli-effectively?tabs=bash%2Cbash2#work-behind-a-proxy).
</td>
</tr>
</table>

Adjust the location, resource group name, and tags below to suit your needs.
Note that these instructions use [Transaction Optimized
storage](https://azure.microsoft.com/en-us/pricing/details/storage/files/) and
[Locally redundant
storage](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy).

```bash
location="southcentralus"
groupName="meadowlark-stg"
maintainedBy="Your Name"
storageAccountName="meadowlark"
shareName="meadowlark0stg"

az login

az group create \
  --location $location \
  --name $groupName \
  --tags maintained-by=$maintainedBy

az storage account create \
  --resource-group $groupName \
  --name $storageAccountName \
  --kind StorageV2 \
  --sku Standard_LRS \
  --enable-large-file-share \
  --output none \
  --tags maintained-by=$maintainedBy

az storage share-rm create \
  --resource-group $groupName \
  --storage-account $storageAccountName \
  --name $shareName"0mongo0auth" \
  --access-tier "TransactionOptimized" \
  --output none

az storage share-rm create \
  --resource-group $groupName \
  --storage-account $storageAccountName \
  --name $shareName"0mongo1data" \
  --access-tier "TransactionOptimized" \
  --output none

az storage share-rm create \
  --resource-group $groupName \
  --storage-account $storageAccountName \
  --name $shareName"0mongo1log" \
  --access-tier "TransactionOptimized" \
  --output none

az storage share-rm create \
  --resource-group $groupName \
  --storage-account $storageAccountName \
  --name $shareName"0mongo2data" \
  --access-tier "TransactionOptimized" \
  --output none

az storage share-rm create \
  --resource-group $groupName \
  --storage-account $storageAccountName \
  --name $shareName"0mongo2log" \
  --access-tier "TransactionOptimized" \
  --output none

az storage share-rm create \
  --resource-group $groupName \
  --storage-account $storageAccountName \
  --name $shareName"0mongo3data" \
  --access-tier "TransactionOptimized" \
  --output none

az storage share-rm create \
  --resource-group $groupName \
  --storage-account $storageAccountName \
  --name $shareName"0mongo3log" \
  --access-tier "TransactionOptimized" \
  --output none

az storage share-rm create \
  --resource-group $groupName \
  --storage-account $storageAccountName \
  --name $shareName"0search" \
  --access-tier "TransactionOptimized" \
  --output none
```

File share names can only contain lowercase letters and numbers. In this case we
use `0` to separate `meadowlark` from an environment name, `stg`. You can choose
any convention you like. Also note that the `share-rm create` command does not
accept the `--tags` argument.

## Adding Meadowlark Image to Azure Container Registry (ACR)

The Meadowlark image needs to exist on an accessible registry on the Internet,
for example [Docker Hub](https://hub.docker.com) or [Azure Container
Registry](https://learn.microsoft.com/en-us/azure/container-registry/) (ACR). In
the long-term, the Alliance will likely publish an official image on Docker Hub.
For now, the best thing to do is build one locally and push it into ACR.

❗ If you run into a credential error on login, then it may be due to being
signed into another account (e.g. Docker Hub) in Docker Desktop. Try signing out
via Docker desktop (or `docker logout`) and then run the login command again.

**Bash**

```bash
CONTAINER_REGISTRY="your registry name"

az acr create \
  --resource-group meadowlark-stg \
  --name $CONTAINER_REGISTRY \
  --sku Basic

az acr login \
  --name $CONTAINER_REGISTRY
```

Now build and push the image (no line breaks, so only one block of commands this
time):

```bash
docker build -t meadowlark-api .

docker tag meadowlark-api "$CONTAINER_REGISTRY.azurecr.io/meadowlark-api"

docker push "$CONTAINER_REGISTRY.azurecr.io/meadowlark-api"

docker tag meadowlark-mongodb "$CONTAINER_REGISTRY.azurecr.io/meadowlark-mongodb:4.0.28"

docker push "$CONTAINER_REGISTRY.azurecr.io/meadowlark-mongodb:4.0.28"
```

(Ed-Fi: use `CONTAINER_REGISTRY='edfimeadowlark'`)

_Also see: [Quickstart: Create a private container registry using the Azure
CLI](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-azure-cli).

🚧 ACI needs credentials for accessing ACR. Use [Authenticate with Azure Container
Registry from Azure Container
Instances](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-auth-aci)
to create a script. Saw this was encouraged somewhere, but now I'm not sure how it would actually be used.

```bash
SERVICE_PRINCIPAL_NAME=meadowlarkSP
ACR_REGISTRY_ID=$(az acr show --name $CONTAINER_REGISTRY --query "id" --output tsv)
SERVICE_PRINCIPAL_PASS=$(az ad sp create-for-rbac --name $SERVICE_PRINCIPAL_NAME --scopes $ACR_REGISTRY_ID --role acrpull --query "password" --output tsv)
SERVICE_PRINCIPAL_ID=$(az ad sp list --display-name $SERVICE_PRINCIPAL_NAME --query "[].appId" --output tsv)
echo "SERVICE_PRINCIPAL_ID=$SERVICE_PRINCIPAL_ID"
echo "SERVICE_PRINCIPAL_PASS=$SERVICE_PRINCIPAL_PASS"
```

Copy and paste the output from the two echo commands into `.env.azure`.

## Deploying Meadowlark

Based on [Docker Docs > Docker and
ACI](https://docs.docker.com/cloud/aci-integration/); see the article for
detailed descriptions.

### Create a Docker Context

💡 Make sure you have already logged in with `docker login azure` or `az acr
login --name $CONTAINER_REGISTRY`.

```bash
docker context create aci meadowlark-stg \
  --resource-group meadowlark-stg \
  --location southcentralus
```

### Prepare Environment Variables

Create a file called `.env.azure` with the following settings:

* `OAUTH_SIGNING_KEY`, which is a base64 encoded, 256 bit key
* `MONGODB_PASS`
* `MONGODB_URI`
* `ELASTIC_PASSWORD`
* `OPENSEARCH_PASSWORD` should be same as above
* Azure Deployment-specific keys:
  * `CONTAINER_REGISTRY`, ex: `edfimeadowlark.azurecr.io`
  * `STORAGE_ACCOUNT_NAME`, same as you used for `$storageAccountName`
  * `SHARE_NAME`, same as you used for `$shareName`

If you have already run through the [Docker local
developer](DOCKER-LOCAL-DEV.md) instructions, then you can simply create
`.env.azure` as a copy of `.env-docker`, and add Azure-specific keys.

### Initialize MongoDB

```bash
az acr login --name edfimeadowlark
docker compose -f docker-compose-azure.yml --env-file ./.env.azure up -d
```

Wrap up notes for the spike:

* `docker compose up` was failing with no output
* Downloaded a newer relese of docker-compose:  https://github.com/docker/compose/releases/tag/v2.16.0. Moved exe to c:\ProgramData\chocolatey\bin so that it would be in my path. In WSL, `alias docker=docker-compose-windows-x86_64.exe`

```bash
$ docker-compose --verbose -f docker-compose-azure.yml --env-file ./.env.azure up -d
[+] Running 1/2
 - Network meadowlark-js_default               Created                                                             0.0s
 - Volume "meadowlark-js_mongo-ml-azure-log2"  Error                                                              15.0s
Error response from daemon: create meadowlark-js_mongo-ml-azure-log2: error looking up volume plugin azure_file: plugin
"azure_file" not found
```

* Change auth volume to not be external. Try just starting everything

* What about just running the container?

```bash
$ docker --context meadowlark-stg run edfimeadowlark/
meadowkark-api
[+] Running 0/1
 - Group objective-keller  Error                                                                                   1.2s
containerinstance.ContainerGroupsClient#CreateOrUpdate: Failure sending request: StatusCode=400 -- Original Error: Code=
"InaccessibleImage" Message="The image 'edfimeadowlark/meadowkark-api' in container group 'objective-keller' is not acce
ssible. Please check the image and registry credential."
```

* Other than using `docker login`, I can't find any instructions on how to provide registry credentials. And I already did that here.
* 💡💡💡 probably need https://github.com/docker/compose-cli/releases/tag/v1.0.30 instead, which is "Docker Compose "Cloud Integrations"

# Meadowlark Kubernetes Deployment

This folder provides a basic setup of a set of
[Kubernetes](https://kubernetes.io/) files to setup a cluster.

## Local Development

For local development, you need to use
[minikube](https://minikube.sigs.k8s.io/docs/start/).

* After installing, run `minikube start` to setup minikube in your local
  environment.
* Set the terminal in the */k8s* folder.
* Run `kubectl apply -f .` to apply all or go file by file (`kubectl apply -f
  {file-name}`).
* After done, inspect with `kubectl get pods`, and verify that all pods have
  status **RUNNING** (This can take a couple of minutes).

This will start the kubernetes infrastructure to run without exposing any
connection to the external network. When installing in a cloud provider the
clouds Load Balancing service will take care of making the connection to the
cluster, by opening a connection to the
[meadowlark-api-service](meadowlark-api-service.yaml).

This container has the type LoadBalancer, meaning that this is the entry point
for the load balancer provider.

To test this in the local environment, we need to open *tunnel* between the
local network and the Kubernetes cluster. To do so, run `minikube service
meadowlark-api --url`.

Copy the URL and connect to Meadowlark.

### View Logs

To get the logs from Meadowlark, verify that the flag `LOG_TO_FILE` is set to
true. If saving to the default location, get the logs by:

1. Get the pod id `kubectl get pods`.
2. Run kubectl exec -it $POD_ID -- cat /var/log/meadowlark.log

### Useful commands

| Command                                         | Description                  |
| ----------------------------------------------- | ---------------------------- |
| `minikube start`                                | Start minikube cluster       |
| `minikube delete`                               | Clean minikube cluster       |
| `kubectl get pods`                              | Get all pods                 |
| `kubectl get deployments`                       | Get all deployments          |
| `kubectl get services`                          | Get all services             |
| `kubectl describe service postgres`             | Get description of a service |
| `kubectl exec -it POD_NAME -- psql -U postgres` | Execute a command in a pod   |

> [!NOTE]
> In Kubernetes you can reference another pod by IP address or by hostname,
> where the host name is the name of the pod.

## Kubernetes Architecture

```mermaid
flowchart LR
    subgraph Kubernetes Network
        subgraph Configuration
            CS[Secret]
            CC[ConfigMap]
        end
        subgraph Pods
            MP[Meadowlark API]
            OP[OpenSearch]
            PP[PostgreSQL]
        end
        subgraph Services
            PS[PostgreSQL Service]
            OS[OpenSearch Service]
            MS[Meadowlark Service]
        end
        subgraph Persistent Volumes
            PV[PostgreSQL Volume]
            OV[OpenSearch Volume]
        end
    end
    I[Internet] --> MS
    MS --> MP
    PS -- connects --> PP
    OS -- connects --> OP
    MP --> PS
    MP --> OS
    PP --> PV
    OP --> OV
    PP --> CC
    OP --> CC
    PP --> CS
```

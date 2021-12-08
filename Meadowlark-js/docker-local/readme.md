# Docker Localhost for Meadowlark

(!) This solution should only be used on localhost with proper firewalls around
external network access to the workstation.

Provisions:

* Elasticsearch
* Kibana
* Elasticsearch storage volume

## Before Starting

The Kibana image has to be rebuilt to disable TLS security.

* Windows: Open a PowerShell prompt and switch to the `kibana-unsecured` directory, then run `.\build.ps1`
* Linux: Open a terminal in the `kibana-unsecured` directory, then run `docker build --tag=kibana-unsecured .`

## Start Services

In this directory, run `docker-compose up -d`

To access Kibana, open http://localhost:5601.

## Monitor

```
docker logs kibana
docker logs elasticsearch
```

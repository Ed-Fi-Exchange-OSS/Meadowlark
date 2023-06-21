# Elasticsearch Backend for Meadowlark

:exclamation: This solution should only be used on localhost with proper firewalls around
external network access to the workstation. Not appropriate for production use.

This Docker Compose file provisions a single node of the ElasticSearch search
engine.

## Test dependency on older "docker-compose" versus newer "docker compose"

The integration tests use the testcontainers library to spin up an Elasticsearch instance. As of
Feb 2023, it uses the legacy "docker-compose" command from Compose V1. If tests fail
with "Error: spawn docker-compose ENOENT", you will need to either [install Compose V1
standalone](https://docs.docker.com/compose/install/other/) or `alias docker-compose='docker compose'`.

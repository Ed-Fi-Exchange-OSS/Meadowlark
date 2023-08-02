# Docker for Local Meadowlark Development

_Also see [DOCKER](DOCKER.md) for more general information about using Docker
for Meadowlark in development, testing, and production_.

:exclamation: These solutions should only be used on localhost with proper
firewalls around external network access to the workstation. Not appropriate for
production use.

These compose files require [Docker Compose
v2](https://github.com/docker/compose) (which comes with Docker Desktop for
Windows users). They provision the following services, all using local volumes
to for permanent data storage:

* [MongoDB, Kafka, and
  Zookeeper](../backends/meadowlark-mongodb-backend/docker/readme.md) <--
  :exclamation: be sure to read for critical one-time manual setup instructions.
* [PostgreSQL](../backends/meadowlark-postgresql-backend/docker/readme.md)
* [OpenSearch](../backends/meadowlark-opensearch-backend/docker/readme.md)
* [ElasticSearch](../backends/meadowlark-elasticsearch-backend/docker/readme.md)

## Global Docker Configuration

Ensure that you have sufficient resources allocated to Docker:

* Windows (not WSL): set RAM to at least 4 GB [user
  manual](https://docs.docker.com/desktop/windows/).
* macOS: set RAM to at least 4 GB [user
  manual](https://docs.docker.com/desktop/mac/).
* Linux, including Windows Subsystem for Linux (WSL/WSL2): Ensure
  vm.max_map_count is set to at least 262144 as [per the
  documentation](https://opensearch.org/docs/opensearch/install/important-settings/).
  * On real Linux: ```sudo sysctl -w vm.max_map_count=262144```
  * On Windows Subsystem for Linux:

    ```powershell
    # Setup a .wslconfig file with the proper setting
    > code ~/.wslconfig
    # enter the following in the file
    [wsl2]
    kernelCommandLine = "sysctl.vm.max_map_count=262144"

    # Shutdown wsl
    > wsl --shutdown

    # Shutdown and restart Docker Desktop
    $processes = Get-Process "*docker desktop*"
    if ($processes.Count -gt 0)
    {
        $processes[0].Kill()
        $processes[0].WaitForExit()
    }
    Start-Process "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    ```

## Containers for Active Development

### PowerShell Start/Stop Script

[Run-DevContainers.ps1](../eng/Run-DevContainers.ps1) is a convenience script
for starting or stopping all three sets of dev containers (MongoDB and friends,
PostgreSQL, OpenSearch).

### Operations

Summary of some commonly useful [docker CLI
commands](https://docs.docker.com/engine/reference/commandline/cli/):

| Operation                      | Command                             |
| ------------------------------ | ----------------------------------- |
| start containers               | `docker compose up -d`              |
| stop containers                | `docker compose down`               |
| view running containers        | `docker ps`                         |
| view OpenSearch logs           | `docker logs opensearch-node1`      |
| view OpenSearch Dashboard logs | `docker logs opensearch-dashboards` |
| view MongoDB logs              | `docker logs mongodb-node1`         |

### VSCode Docker Plugin

The Docker for VSCode plugin is an easy way to manage Docker Containers,
providing right-click `compose up` and `compose down` as well as container
monitoring.

## Containers for Docker-First Local Testing

The containers describe above are great for supporting execution of Meadowlark
from the command line or from Visual Studio Code. What they don't do is run
Meadowlark inside of a container.

For some manual integration tests, or for performance testing, it is good to run
Meadowlark itself inside a container. For that, use the
[docker-compose.yml](../Meadowlark-js/docker-compose.yml) file in the
`Meadowlark-js` directory. This version loads the source code into a container
and builds it there. There is a convenience script for PowerShell called
[reset-docker-compose.ps1](../Meadowlark-js/reset-docker-compose.ps1) that sets
up the local environment correctly. This is particularly useful for setting up a
clean environment between performance test runs.

> **Note**: you'll need a .env file for this.

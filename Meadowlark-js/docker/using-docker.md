# Docker Localhost for Meadowlark

:exclamation: This solution should only be used on localhost with proper firewalls around
external network access to the workstation. Not appropriate for production use.

These compose files require [Docker Compose v2](https://github.com/docker/compose)
(which comes with Docker Desktop for Windows users). They provision the following
services, all using local volumes to for permanent data storage:

### Docker

Ensure that you have sufficient resources allocated to Docker:

* Windows (not WSL): set RAM to at least 4 GB [user manual](https://docs.docker.com/desktop/windows/).
* macOS: set RAM to at least 4 GB [user manual](https://docs.docker.com/desktop/mac/).
* Linux, including Windows Subsystem for Linux (WSL/WSL2): Ensure vm.max_map_count is set to at least 262144 as [per the
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


## Operations

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

The Docker for VSCode plugin is an easy way to manage Docker Containers, providing right-click
`compose up` and `compose down` as well as container monitoring.

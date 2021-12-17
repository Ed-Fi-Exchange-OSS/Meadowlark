# Docker Localhost for Meadowlark

(!) This solution should only be used on localhost with proper firewalls around
external network access to the workstation. Not appropriate for production use.

This compose file requires [Docker Compose v2](https://github.com/docker/compose)
(which comes with Docker Desktop for Windows users). It provisions:

* OpenSearch
* OpenSearch Dashboard at [http://localhost:5601/](http://localhost:5601/)
* External storage volume

Ensure that you have sufficient resources allocated to Docker:

* Windows (not WSL): set RAM to at least 4 GB [user manual](https://docs.docker.com/desktop/windows/).
* macOS: set RAM to at least 4 GB [user manual](https://docs.docker.com/desktop/mac/).
* Linux, including Windows Subsystem for Linux (WSL/WSL2): Ensure vm.max_map_count is set to at least 262144 as [per the
  documentation](https://opensearch.org/docs/opensearch/install/important-settings/).
  * On Linux: ```sudo sysctl -w vm.max_map_count=262144```
  * Permanently setting this on WSL is more challenging than expected. Recipe:

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

At a command prompt, running in this directory:

| Operation | Command |
| -- | -- |
| start containers | `docker compose up -d` |
| stop containers | `docker compose down` |
| view OpenSearch logs | `docker logs opensearch-node1` |
| view Dashboard logs | `docker logs opensearch-dashboards` |

## Visualizations in OpenSearch Dashboards

Once data starts flowing into OpenSearch, you can setup some basic
visualizations with the OpenSearch Dashboards. Basic steps:

1. Open [Create an Index
   Pattern](http://localhost:5601/app/management/opensearch-dashboards/indexPatterns/create)
   1. Step 1: use index pattern `type$ed-fi*`
   2. Step 2: for time field, select "I don't want to use the filter at this time"
   3. Click the "Create Index" button.
2. In the Tools menu click on Visualize, then click the "create new
   visualization" button.
3. Example: choose type `metric` and click through. Now
   you have a count of the records in OpenSearch.
   * Tip: above the metric display you'll find "+ Add Filter". Use this if you
     want to filter on a particular entity type, such as `studentUniqueId:
     exists`.

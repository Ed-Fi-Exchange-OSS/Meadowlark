# Docker Localhost for Meadowlark

(!) This solution should only be used on localhost with proper firewalls around
external network access to the workstation. Not appropriate for production use.

This compose file provisions:

* OpenSearch
* OpenSearch Dashboard
  * [http://localhost:5601/](http://localhost:5601/)
  * username: `admin`, password: `admin`
* External storage volume

Ensure that you have sufficient resources allocated to Docker:

* Windows (not WSL): set RAM to at least 4 GB [user manual](https://docs.docker.com/desktop/windows/).
* macOS: set RAM to at least 4 GB [user manual](https://docs.docker.com/desktop/mac/).
* Linux, including Windows Subsystem for Linux (WSL/WSL2): Ensure vm.max_map_count is set to at least 262144 as [per the
  documentation](https://opensearch.org/docs/opensearch/install/important-settings/).
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
    Start-Process "$Env:ProgramFiles\\Docker\Docker\Docker Desktop.exe"
    ```

## Before Starting

In this configuration, you need to build a new OpenSearch image with TLS
(certificate) security disabled.

* Windows: Open a PowerShell prompt and switch to the `unsecured` directory, then run `.\build.ps1`
* Linux: Open a terminal in the `-unsecured` directory, then run `docker build --tag=kibana-unsecured .`

## Start Services

In this directory, run `docker compose up -d`

## Monitor

```bash
docker logs opensearch-dashboards
docker logs opensearch-node1
```

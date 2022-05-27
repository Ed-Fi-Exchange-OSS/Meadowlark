# Docker Localhost for Meadowlark

:exclamation: This solution should only be used on localhost with proper firewalls around
external network access to the workstation. Not appropriate for production use.

These compose files require [Docker Compose v2](https://github.com/docker/compose)
(which comes with Docker Desktop for Windows users). They provision the following
services, all using local volumes to for permanent data storage:

* [MongoDB](mongo/): starts a 3-node replica set of MongoDB 4.0 instances on ports 27017, 27018, and 27019.
* [OpenSearch](opensearch/): single node cluster of OpenSearch database and [OpenSearch
  Dashboard](http://localhost:5601/) (latest versions).
* [PostgreSQL](postgres/): single instance of PostgreSQL 14.

This repository does not have a compose file for DynamoDB, because the
configuration is not well documented. For DynamoDB startup, run the `yarn
init:local-dynamodb` command in the
[meadowlark-aws-lambda](../Meadowlark-js/services/meadowlark-aws-lambda/)
directory.

## Preparatory Steps

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

### MongoDB Hosts

MongoDB replica sets require the hostname in the connection string to match the hostname of each node.
Because the container hostnames are mongo1, mongo2 and mongo3, add the following line to your
hosts file:

`127.0.0.1 mongo1 mongo2 mongo3`

## Operations

To startup just one of the three sets of services, open a command prompt, change
to that directory, and run `docker compose up -d`. You can customize the PostgreSQL
startup with three environment variables, which can also be placed into a `.env` file:

* `POSTGRES_USER` (default value: "postgres")
* `POSTGRES_PASSWORD` (default value: "abcdefgh1!")
* `POSTGRES_PORT` (default value: 5432)

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

### Visualizations in OpenSearch Dashboards

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

### Browsing MongoDB

[MongoDB Compass](https://www.mongodb.com/docs/compass/current/) is a freely available UI tool
for browsing and importing data into MongoDB. `mongodb://mongo1:27017,mongo2:27018,mongo3:27019` is the connection
string to use for this MongoDB replica set. Login/password security is disabled in the default
MongoDB container configuration.

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

#Requires -Version 7
param(
  [Parameter(Mandatory=$false)]
  [Switch]
  $Clean,

  [Parameter(Mandatory=$false)]
  [Switch]
  $ElasticSearch,

  [Parameter(Mandatory=$false)]
  [Switch]
  $OpenSearch,

  [Parameter(Mandatory=$false)]
  [Switch]
  $MongoDB,

  [Parameter(Mandatory=$false)]
  [Switch]
  $PostgreSQL
)

$ErrorActionPreference = "Stop"

$stop = @()
$volumes = @()
if ($ElasticSearch) {
  $stop += "meadowlark-elasticsearch-backend"
  $volumes += "docker_esdata01"
}
if ($OpenSearch) {
   $stop += "meadowlark-opensearch-backend"
   $volumes += "docker_opensearch-data1"
}
if ($MongoDB) {
  $stop += "meadowlark-mongodb-backend"
  $volumes += "docker_mongo-data1"
  $volumes += "docker_mongo-data2"
  $volumes += "docker_mongo-data3"
  $volumes += "docker_mongo-log1"
  $volumes += "docker_mongo-log2"
  $volumes += "docker_mongo-log3"
  $volumes += "docker_zookeeper-data"
  $volumes += "docker_zookeeper-logs"
}
if ($PostgreSQL) {
  $stop += "meadowlark-postgresql-backend"
  $volumes += "docker_meadowlark-pgsql"
}

$stop | ForEach-Object {
  &docker compose `
    -f "$PSScriptRoot/../Meadowlark-JS/backends/$_/docker/docker-compose.yml" `
    stop

  &docker compose `
    -f "$PSScriptRoot/../Meadowlark-JS/backends/$_/docker/docker-compose.yml" `
    rm -v
}

if ($Clean) {
  $volumes | ForEach-Object {
    docker volume rm $_
  }
}

docker network prune -f

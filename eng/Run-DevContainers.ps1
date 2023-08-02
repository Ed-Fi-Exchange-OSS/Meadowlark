# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

<#
.DESCRIPTION
    Start or stop all of the development containers: MongoDB, OpenSearch, and
    PostgreSQL. The MongoDB collection also includes Kafka with Debezium.
#>
param(
    
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

$start = @()
if ($ElasticSearch) { $start += "meadowlark-elasticsearch-backend" }
if ($OpenSearch) { $start += "meadowlark-opensearch-backend"}
if ($MongoDB) { $start += "meadowlark-mongodb-backend" }
if ($PostgreSQL) { $start += "meadowlark-postgresql-backend" }

$start | ForEach-Object {
  &docker compose `
    -f "$PSScriptRoot/../Meadowlark-JS/backends/$_/docker/docker-compose.yml" `
    up -d
}

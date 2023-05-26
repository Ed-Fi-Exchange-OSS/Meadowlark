# # SPDX-License-Identifier: Apache-2.0
# # Licensed to the Ed-Fi Alliance under one or more agreements.
# # The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# # See the LICENSE and NOTICES files in the project root for more information.

#Requires -Version 7
$ErrorActionPreference = "Stop"

$containerNames = "mongo-test", "postgres-test", "opensearch-test", "meadowlark-api-test"
foreach ($containerName in $containerNames)
{
  $container = docker ps -q --filter "name=$containerName"
  if($container) {
    docker stop $container
    docker rm -f $container
  }
}


docker network prune -f

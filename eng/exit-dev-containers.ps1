# # SPDX-License-Identifier: Apache-2.0
# # Licensed to the Ed-Fi Alliance under one or more agreements.
# # The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# # See the LICENSE and NOTICES files in the project root for more information.

#Requires -Version 7
# $ErrorActionPreference = "Stop"

$docker=docker

if ($a -gt 2) {
  # Running under WSL1, need to reference docker.exe instead of docker. Simple
  # alias doesn't work, sadly. This variable helps in the context of this
  # script, but need to use "wsl1" commands with npm.
  $docker=docker.exe
}


$containerNames = "mongo-test", "postgres-test", "opensearch-test", "meadowlark-api-test"
foreach ($containerName in $containerNames)
{
  if (wsl --list --verbose | Where {$_ -match '2'}[0]) {
    $container = docker ps -q --filter "name=$containerName"
    if($container) {
      docker stop $container
      docker rm -f $container
    }
  } else {
    $container = docker.exe ps -q --filter "name=$containerName"
    if($container) {
      docker.exe stop $container
      docker.exe rm -f $container
    }
  }
}


if (wsl --list --verbose | Where {$_ -match '2'}[0]) {
  docker network prune -f
} else {
  docker.exe network prune -f
}

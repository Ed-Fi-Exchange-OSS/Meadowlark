#!/usr/bin/env bash
set -e -o pipefail

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

docker=docker
if [[ $(grep Microsoft /proc/version) ]]; then
# Running under WSL1, need to reference docker.exe instead of docker. Simple
# alias doesn't work, sadly. This variable helps in the context of this
# script, but need to use "wsl1" commands with npm.
  docker=docker.exe
fi

for container in "mongo-test" "postgres-test" "opensearch-test" "elasticsearch-node-test" "meadowlark-api-test"
do
  docker ps -q --filter "name=$container" | grep -q . && docker stop $container && docker rm -f $container
done

docker network prune -f

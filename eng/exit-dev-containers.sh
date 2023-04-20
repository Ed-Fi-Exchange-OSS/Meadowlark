# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

#!/bin/bash

docker ps -q --filter "name=mongo-test" | grep -q . && docker stop mongo-test && docker rm -f mongo-test
docker ps -q --filter "name=postgres-test" | grep -q . && docker stop postgres-test && docker rm -f postgres-test
docker ps -q --filter "name=opensearch-test" | grep -q . && docker stop opensearch-test && docker rm -f opensearch-test
docker ps -q --filter "name=meadowlark-api-test" | grep -q . && docker stop meadowlark-api-test && docker rm -f meadowlark-api-test

docker network prune -f

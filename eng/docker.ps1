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
    # Stops the Docker services
    [Switch]
    $Stop
)

@(
    "$PSScriptRoot/../Meadowlark-js/backends/meadowlark-mongodb-backend",
    "$PSScriptRoot/../Meadowlark-js/backends/meadowlark-opensearch-backend",
    "$PSScriptRoot/../Meadowlark-js/backends/meadowlark-postgresql-backend"
) | ForEach-Object {
    try {
        Push-Location $_/docker

        if ($Stop) {
            docker compose down
        }
        else {
            docker compose up -d
        }
    }
    finally {
        Pop-Location
    }
}



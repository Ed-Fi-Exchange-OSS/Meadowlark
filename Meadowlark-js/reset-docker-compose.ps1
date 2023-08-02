# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

<#
.DESCRIPTION
    Wipes out and recreates the "local" docker-compose configuration. Great for
    resetting environment to a clean state between performance test executions.
#>

# Make sure the custom image is built locally
Push-Location ../docker/mongodb
docker build -t edfi-mongo:4.0.28 .
Pop-Location

# Clean up
docker compose down -v
docker volume rm mongo-ml-local-auth

Start-Sleep 2

# Re-initialize
docker volume create --label edfi-ml=local mongo-ml-local-auth
docker run -d --name mongo-temp -v mongo-ml-local-auth:/auth edfi-mongo:4.0.28 
docker exec mongo-temp /usr/local/bin/mongo-key-file-setup.sh
docker rm -f mongo-temp

# Restart
docker compose up -d

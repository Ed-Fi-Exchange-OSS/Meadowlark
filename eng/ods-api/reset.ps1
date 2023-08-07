# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

docker compose down -v
docker compose build
docker compose up -d

# Long sleep for the db to initialize before the scripts below can run safely
Start-Sleep 8

docker cp ./bootstrap.sql ed-fi-db-admin-meadowlark:/tmp
docker exec -i ed-fi-db-admin-meadowlark sh -c "psql -U postgres -d EdFi_Admin -f /tmp/bootstrap.sql"
docker exec -i ed-fi-db-admin-meadowlark sh -c "rm /tmp/bootstrap.sql"

# Wait a bit longer for the API to come up
do {
  curl http://localhost
  Start-Sleep 1
}
while($LASTEXITCODE -ne 0)

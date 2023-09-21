# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

chmod -R +x ./scripts
docker run -d --name mongo-temp -v mongo-auth:/auth mongo:6.0
docker exec mongo-temp mkdir /scripts
docker cp ./backends/meadowlark-mongodb-backend/docker/scripts/mongo-key-file-setup.sh mongo-temp:/scripts/mongo-key-file-setup.sh
docker exec mongo-temp ./scripts/mongo-key-file-setup.sh
docker compose -f ./backends/meadowlark-mongodb-backend/docker/docker-compose.yml  up -d

echo "Adding URL to hosts"
echo '127.0.0.1 mongo1 mongo2 mongo3' | sudo tee -a /etc/hosts

# Wait for environment
sleep 30;

echo "Setting replica set"
docker exec mongo1 ./scripts/mongo-rs-setup.sh

# Wait for environment
sleep 30;

docker exec -e ADMIN_USERNAME=mongo -e ADMIN_PASSWORD=abcdefgh1! mongo1 ./scripts/mongo-user-setup.sh

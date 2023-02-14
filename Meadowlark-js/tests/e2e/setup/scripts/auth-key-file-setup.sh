#!/bin/bash

echo "Configuring MongoDB shared key file..."
docker run -d --name mongo-test-temp -v mongo-test-auth:/auth mongo:4.0.28
docker exec mongo-test-temp bash -c "openssl rand -base64 700 > /auth/file.key"
docker exec mongo-test-temp bash -c "chmod 400 /auth/file.key"
docker exec mongo-test-temp bash -c "chown 999:999 /auth/file.key"
docker rm -f mongo-test-temp

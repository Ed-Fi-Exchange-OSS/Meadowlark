#!/bin/bash

docker=docker
if [[ $(grep Microsoft /proc/version) ]]; then
    # Running under WSL1, need to reference docker.exe instead of docker. Simple
    # alias doesn't work, sadly. This variable helps in the context of this
    # script, but need to use "wsl1" commands with npm.
    docker=docker.exe
fi

echo "Configuring MongoDB shared key file..."
$docker run -d --name mongo-test-temp -v mongo-test-auth:/auth mongo:4.0.28
$docker exec mongo-test-temp bash -c "openssl rand -base64 700 > /auth/file.key"
$docker exec mongo-test-temp bash -c "chmod 400 /auth/file.key"
$docker exec mongo-test-temp bash -c "chown 999:999 /auth/file.key"
$docker rm -f mongo-test-temp

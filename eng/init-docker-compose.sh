#!/usr/bin/env bash
set -e -o pipefail

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

# Switch to the Meadowlark-js directory
pushd $(dirname "${BASH_SOURCE[0]}")/../Meadowlark-js
{ # simulate `try`

  if test -f .env-docker; then
    echo "There is already a .env-docker file. Do you want to delete it and start over?"
    read deleteit
    if [[ $deleteit == y* ]]; then
        rm .env-docker
    else
        echo "OK, we'll append new values to your existing file."
    fi
  fi

  echo "Do you want to rebuild the Meadowlark API image?"
  read rebuild

  # Build the local image
  docker=docker
  if [[ $(grep Microsoft /proc/version) ]]; then
    # Running under WSL1, need to reference docker.exe instead of docker. Simple
    # alias doesn't work, sadly. This variable helps in the context of this
    # script, but need to use "wsl1" commands with npm.
    docker=docker.exe

    if [[ $rebuild == y* ]]; then
      echo "Building the image..."
      npm run docker:build:wsl1
    else
      echo "Skipping image build."
    fi
  else
    if [[ $rebuild == y* ]]; then
      echo "Building the image..."
      npm run docker:build
    else
      echo "Skipping image build."
    fi
  fi

  # Create a `.env-docker` file, injecting a new OAUTH signing key
  # and random passwords for each container

  echo "Creating .env-docker file..."
  touch .env-docker
  echo OAUTH_SIGNING_KEY="$( openssl rand -base64 256 | tr -d '\r\n' )" >> .env-docker
  mongoPassword="$( openssl rand -base64 10 | tr -d '\n')"
  echo MONGODB_PASS="$mongoPassword" >> .env-docker
  echo MONGODB_URI="mongodb://mongo:\${MONGODB_PASS}@mongo1:27017,mongo2:27018,mongo3:27019/?replicaSet=rs0"

  # TODO: changing the OpenSearch admin credentials is non-trivial and needs to be handled in a different ticket.

  echo "# OpenSearch 2.5.0 still uses env var ELASTIC_PASSWORD. This is confusing;" >> .env-docker
  echo "# set both so that we can reference OPENSEARCH_PASSWORD in docker compose." >> .env-docker
  openSearchPassword="$( openssl rand -base64 10 | tr -d '\r\n')"
  echo ELASTIC_PASSWORD="$openSearchPassword" >> .env-docker
  echo OPENSEARCH_PASS="$openSearchPassword" >> .env-docker

  # Now, let's configure a container with a shared key file for the MongoDB instances
  echo "Configuring MongoDB shared key file..."
  $docker run -d --name mongo-temp -v mongo-ml-local-auth:/auth mongo:4.0.28
  $docker exec mongo-temp mkdir /scripts
  $docker cp ./backends/meadowlark-mongodb-backend/docker/scripts/mongo-key-file-setup.sh mongo-temp:/scripts/mongo-key-file-setup.sh
  $docker exec mongo-temp /scripts/mongo-key-file-setup.sh
  $docker rm -f mongo-temp

  # Now, start everything
  if [[ $(grep Microsoft /proc/version) ]]; then
    npm run compose:up:wsl1
  else
    npm run compose:up
  fi

  sleep 1

  # Setup MongoDB security
  echo "Configuring MongoDB security and replication..."
  $docker cp ./backends/meadowlark-mongodb-backend/docker/scripts/ mongo1-ml-local:/
  $docker exec mongo1-ml-local /scripts/mongo-rs-setup.sh

  echo "Sleeping for 20 seconds to let replication take hold.."
  sleep 20

  echo "Setting up the MongoDB admin username and password..."
  $docker exec -e ADMIN_USERNAME=mongo -e ADMIN_PASSWORD="$mongoPassword" mongo1-ml-local /scripts/mongo-user-setup.sh

  # Shut the containers down again
  if [[ $(grep Microsoft /proc/version) ]]; then
   npm run compose:down:wsl1
  else
   npm run compose:down
  fi

  echo "Done. Ready to run docker compose."

  # Return to original location
  popd

} || { # simulate `catch`

  >&2 echo "Please review the error above carefully. Attempting to teardown all created resources now."
  if [[ $(grep Microsoft /proc/version) ]]; then
    npm run compose:rm:wsl1
  else
    npm run compose:down
  fi
  popd
}

#!/usr/bin/env bash
set -e -o pipefail
shopt -s expand_aliases

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

# Switch to the Meadowlark-js directory
srcDirectory=$(dirname "${BASH_SOURCE[0]}")
pushd $srcDirectory/../Meadowlark-js > /dev/null
{ # simulate `try`

  usage() { echo "Usage: $0 [-e <env file>] [-a <ACI context name>]" 1>&2; exit 1; }

  # Credit: https://stackoverflow.com/a/16496491/30384
  while getopts ":e:a:" flag; do
    case "${flag}" in
        e)
          envFile=$(realpath "$srcDirectory/${OPTARG}")
          ;;
        a)
          aciContext=$(echo ${OPTARG})
          ;;
        *)
          usage
          ;;
    esac
  done


  if [[ $envFile == "" ]] || [[ $aciContext == "" ]]; then
    usage
  fi

  if [[ $envFile == "" ]] || [ ! -f $envFile ]; then
    echo "File $envFile does not exist or cannot be read."
    exit
  fi

  docker=docker
  if [[ $(grep Microsoft /proc/version) ]]; then
    # Running under WSL1, need to reference $docker.exe instead of $docker. Simple
    # alias doesn't work, sadly. This variable helps in the context of this
    # script, but need to use "wsl1" commands with npm.
    docker=docker.exe
  fi


  # Save current Docker context, then switch to Meadowlark context
  currentContext=$($docker context show)
  $docker context use $aciContext > /dev/null

  # `$docker compose --env-file` throws a misleading error when used with ACI. It
  # appears that env file is simply not supported. So read in the variables
  # manually. Credit:
  # https://stackoverflow.com/a/73892138/30384
  # https://stackoverflow.com/a/48155918/30384
  env=""
  while read line ; do
    # Ignore lines that start with #
    [[ "$line" =~ ^[[:space:]]*# ]] && continue

    # This is a crude way of loading environment variables, and could have weird side
    # effects in edge cases. For example, "something=*" will cause `something` to have
    # a value of a list of the files in the current directory.
    #eval $line

    env="$env -e $line"

  done < $envFile


  # Now, let's configure a container with a shared key file for the MongoDB instances
  echo "Configuring MongoDB shared key file..."
  $docker run -d --name mongo-temp -v ${STORAGE_ACCOUNT_NAME}/${SHARE_NAME}0mongo0auth:/auth ${CONTAINER_REGISTRY}/meadowlark-mongo:4.0.28
  $docker exec mongo-temp mkdir /scripts

  # TODO: didn't get past the line above, so lines below need to be adjusted.
  # Different strategy: script is already in the custom Mongo container, just run it.
  # $docker cp ./backends/meadowlark-mongodb-backend/docker/scripts/mongo-key-file-setup.sh mongo-temp:/scripts/mongo-key-file-setup.sh
  # $docker exec mongo-temp /scripts/mongo-key-file-setup.sh
  # $docker rm -f mongo-temp

  # # Now, start everything
  # $docker compose -f ./docker-compose-azure.yml up -d

  # sleep 1

  # # Setup MongoDB security
  # echo "Configuring MongoDB security and replication..."
  # $docker cp ./backends/meadowlark-mongodb-backend/docker/scripts/ mongo1-ml-local:/
  # $docker exec mongo1-ml-local /scripts/mongo-rs-setup.sh

  # echo "Sleeping for 20 seconds to let replication take hold..."
  # sleep 20

  # echo "Setting up the MongoDB admin username and password..."
  # $docker exec -e ADMIN_USERNAME=mongo -e ADMIN_PASSWORD="$mongoPassword" mongo1-ml-local /scripts/mongo-user-setup.sh

  # Shut the containers down again
  $docker compose -f ./docker-compose-azure.yml down

  echo "Done. Ready to run docker compose."

  # Restore original context
  $docker context use $currentContext > /dev/null

  # Return to original location
  popd > /dev/null

} || { # simulate `catch`

  >&2 echo "Please review the error above carefully."

  popd
}

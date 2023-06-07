#!/usr/bin/env bash
set -e -o pipefail

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

if [ ! $HOSTNAME == "mongo1" ]; then
  exit
fi

# Create the security key file if needed
if [ ! -f /auth/file.key ]; then
  openssl rand -base64 700 > /auth/file.key
  chmod 400 /auth/file.key
  chown 999:999 /auth/file.key
fi

# Initialize 3-node replica setup if needed
if [ ! -f /auth/replicaSetup ]; then

  if [ ! $? == 0 ]; then
    >&2 echo "Unable to start MongoDB service, exiting script"
    exit
  fi

  echo "Initializing MongoDB Replication"
  command="var cfg = {
  \"_id\": \"rs0\",
  \"protocolVersion\": 1,
  \"version\": 1,
  \"members\": [
      {
          \"_id\": 0,
          \"host\": \"mongo1:27017\",
          \"priority\": 2
      },
      {
          \"_id\": 1,
          \"host\": \"mongo2:27018\",
          \"priority\": 0
      },
      {
          \"_id\": 2,
          \"host\": \"mongo3:27019\",
          \"priority\": 0
      }
  ],settings: {chainingAllowed: true}
};
rs.initiate(cfg, { force: true });
rs.status();
  "
  mongo --eval "$command"

  if [ ! $? == 0 ]; then
    >&2 echo "Unable to initialize MongoDB replication, exiting script"
    kill -9 $pid
    exit
  fi

  echo "Sleeping for 20 seconds to let replication take hold.."
  sleep 20

  command="use admin;
admin = db.getSiblingDB(\"admin\");
admin.createUser(
{
  user: \"$ADMIN_USERNAME\",
  pwd: \"$ADMIN_PASSWORD\",
  roles: [ { role: \"root\", db: \"admin\" } ]
});
db.getSiblingDB(\"admin\").auth(\"$ADMIN_USERNAME\", \"$ADMIN_PASSWORD\");
"
  mongo --eval "$command"

  if [ ! $? == 0 ]; then
    >&2 echo "Unable to setup authentication, exiting script"
    exit
  fi

  # Prevent this block from running again
  touch /auth/replicaSetup
fi

#!/usr/bin/env bash
set -e -o pipefail

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

# Initialize 3-node replica setup
echo ">>>> Start MongoDB replica setup <<<<"

# Start Mongo in regular mode, in the background. Capture PID to enable
# killing it later.
echo "Start Mongo"
/usr/bin/mongod --bind_ip_all --replSet rs0 --keyFile /auth/file.key &

# Sleep again to let mongod startup
sleep 10

if [ ! $? == 0 ]
then
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
        \"host\": \"mongo2:27017\",
        \"priority\": 0
    },
    {
        \"_id\": 2,
        \"host\": \"mongo3:27017\",
        \"priority\": 0
    }
],settings: {chainingAllowed: true}
};
rs.initiate(cfg, { force: true });
rs.status();
"
mongo --eval "$command"

if [ ! $? == 0 ]
then
  >&2 echo "Unable to initialize MongoDB replication, exiting script"
  mongod --shutdown
  exit
fi

echo "Sleeping to let replication take hold"
sleep 15

command="admin = db.getSiblingDB(\"admin\");
admin.createUser({
user: \"$ADMIN_USERNAME\",
pwd: \"$ADMIN_PASSWORD\",
roles: [ { role: \"root\", db: \"admin\" } ]
});
db.getSiblingDB(\"admin\").auth(\"$ADMIN_USERNAME\", \"$ADMIN_PASSWORD\");
"
mongo --eval "$command"

if [ ! $? == 0 ]
then
  >&2 echo "Unable to setup authentication, exiting script"
  mongod --shutdown
  exit
fi

mongod --shutdown

# Prevent this block from running again
touch /auth/replicaSetup

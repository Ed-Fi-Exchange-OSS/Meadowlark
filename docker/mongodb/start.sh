#!/usr/bin/env bash
set -e -o pipefail

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

# NOTE: this script is intended to be running on most Mongo nodes in a cluster.
# One and only one node needs to run `start-node1.sh` instead.

echo ">>>> Starting MongoDB <<<<"
/usr/bin/mongod --bind_ip_all \
  --replSet rs0 \
  --journal \
  --dbpath /data/db \
  --enableMajorityReadConcern true \
  --keyFile /auth/file.key

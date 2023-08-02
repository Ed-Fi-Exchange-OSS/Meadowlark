#!/usr/bin/env bash
set -e -o pipefail

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

if [ ! -f /auth/replicaSetup ]
then
  # The file above will be created by this script; thus its presence indicates
  # the script has completed successfully.
  /usr/local/bin/initialize-cluster.sh

  if [ ! $? == 0 ]; then
    >&2 echo ">>>> Initialization failed, please review logs above <<<<"
    exit
  fi

  echo ">>>> Initialization Complete <<<<"
fi

/usr/local/bin/start.sh

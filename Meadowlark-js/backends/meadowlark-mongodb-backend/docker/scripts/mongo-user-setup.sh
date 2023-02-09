#!/bin/bash

# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

mongo <<EOF
use admin;
admin = db.getSiblingDB("admin");
admin.createUser(
{
    user: "$ADMIN_USERNAME",
    pwd: "$ADMIN_PASSWORD",
    roles: [ { role: "root", db: "admin" } ]
});
db.getSiblingDB("admin").auth("$ADMIN_USERNAME", "$ADMIN_PASSWORD");
EOF
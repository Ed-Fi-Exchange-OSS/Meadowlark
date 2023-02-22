#!/bin/bash

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
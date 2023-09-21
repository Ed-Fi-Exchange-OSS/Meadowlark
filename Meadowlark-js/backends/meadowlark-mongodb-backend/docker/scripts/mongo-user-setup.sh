#!/bin/bash

until mongosh --host mongo1:27017 --eval 'quit(db.runCommand({ ping: 1 }).ok ? 0 : 2)' &>/dev/null; do
  printf '.'
  sleep 1
done

cd /
echo '
use admin;
admin = db.getSiblingDB("admin");
admin.createUser(
{
    user: "edfiuser",
    pwd: "gapuser1234",
    roles: [ { role: "root", db: "admin" } ]
});
db.getSiblingDB("admin").auth("edfiuser", "gapuser1234");
' > /config-replica.js
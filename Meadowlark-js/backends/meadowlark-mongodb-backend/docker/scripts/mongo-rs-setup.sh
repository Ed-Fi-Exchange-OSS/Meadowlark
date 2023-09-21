#!/bin/bash

# mongo  <<EOF
# var cfg = {
#     "_id": "rs0",
#     "protocolVersion": 1,
#     "version": 1,
#     "members": [
#         {
#             "_id": 0,
#             "host": "mongo1:27017",
#             "priority": 3
#         },
#         {
#             "_id": 1,
#             "host": "mongo2:27018",
#             "priority": 2
#         },
#         {
#             "_id": 2,
#             "host": "mongo3:27019",
#             "priority": 1
#         }
#     ],settings: {chainingAllowed: true}
# };
# rs.initiate(cfg, { force: true });
# rs.status();
# EOF

# TODO: This script assumes the following
# you named the container where your mongod runs 'mongo'
# you changed MONGO_INITDB_DATABASE to 'admin'
# you set MONGO_INITDB_ROOT_USERNAME to 'root'
# you set MONGO_INITDB_ROOT_PASSWORD to 'secret'
# you set the replica set name to 'rs0' (--replSet)
until mongosh --host mongo1:27017 --eval 'quit(db.runCommand({ ping: 1 }).ok ? 0 : 2)' &>/dev/null; do
  printf '.'
  sleep 1
done

cd /
echo '
try {
    var config = {
        "_id": "rs0",
        "version": 1,
        "members": [
        {
            "_id": 0,
            "host": "mongo1:27017",
            "priority": 3
        },
        {
            "_id": 1,
            "host": "mongo2:27018",
            "priority": 2
        },
        {
            "_id": 2,
            "host": "mongo3:27019",
            "priority": 1
        }
        ]
    };
    rs.initiate(config, { force: true });
    rs.status();
    sleep(5000);
} catch(e) {
    rs.status().ok
}
' > /config-replica.js


# if the output of the container mongo_setup exited with code 0, everything is probably okay
#!/bin/bash

mongo  <<EOF
var cfg = {
    "_id": "rs0",
    "protocolVersion": 1,
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
    ],settings: {chainingAllowed: true}
};
rs.initiate(cfg, { force: true });
rs.status();
EOF

#!/bin/bash

mongo  <<EOF
var cfg = {
    "_id": "tr0",
    "protocolVersion": 1,
    "version": 1,
    "members": [
        {
            "_id": 0,
            "host": "mongo-t1:27017",
            "priority": 2
        },
        {
            "_id": 1,
            "host": "mongo-t2:27018",
            "priority": 0
        }
    ],settings: {chainingAllowed: true}
};
rs.initiate(cfg, { force: true });
rs.status();
EOF

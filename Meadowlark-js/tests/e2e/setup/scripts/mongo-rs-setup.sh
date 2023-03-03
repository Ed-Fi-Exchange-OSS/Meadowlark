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
        }
    ],settings: {chainingAllowed: true}
};
rs.initiate(cfg, { force: true });
rs.status();
EOF

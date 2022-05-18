#!/bin/bash

echo "Waiting for mongo 1 startup"
until mongo --host mongo1 --port 27017 --eval "print(\"hello\")"; do
    echo -n .; sleep 2
done

echo "Waiting for mongo 2 startup"
until mongo --host mongo2 --port 27018 --eval "print(\"hello\")"; do
    echo -n .; sleep 2
done

echo "Waiting for mongo 3 startup"
until mongo --host mongo3 --port 27019 --eval "print(\"hello\")"; do
    echo -n .; sleep 2
done


echo SETUP.sh time now: `date +"%T" `
mongo --host mongo1:27017 <<EOF
var cfg = {
    "_id": "rs0",
    "protocolVersion": 1,
    "version": 1,
    "members": [
        {
            "_id": 0,
            "host": "mongo1:27017",
            "priority": 2
        },
        {
            "_id": 1,
            "host": "mongo2:27018",
            "priority": 0
        },
        {
            "_id": 2,
            "host": "mongo3:27019",
            "priority": 0
        }
    ],settings: {chainingAllowed: true}
};
rs.initiate(cfg, { force: true });
rs.reconfig(cfg, { force: true });
rs.setSlaveOk();
db.getMongo().setReadPref('nearest');
db.getMongo().setSlaveOk();
EOF
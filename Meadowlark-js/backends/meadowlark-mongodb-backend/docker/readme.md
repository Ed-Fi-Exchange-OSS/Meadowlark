# MongoDB Backend for Meadowlark

:exclamation: This solution should only be used on localhost with proper firewalls around
external network access to the workstation. Not appropriate for production use.

This Docker Compose file provisions a 3-node replica set of MongoDB 4.0 instances on ports 27017, 27018, and 27019.
It also provisions a Debezium connection from the MongoDB replica set to a Kafka instance, along with a
simple Kafka browser. Note that while the MongoDB containers persist their data, in this configuration
the Debezium and Kafka containers are transient.

## MongoDB Preparatory Steps

### Local Hosts File

MongoDB replica sets require the hostname in the
[connection string](https://www.mongodb.com/docs/manual/reference/connection-string/) to match the hostname
of each node. Access to MongoDB from the host system requires this hostname configuration. Because the container
hostnames are mongo1, mongo2 and mongo3, add the following line to your hosts file:

`127.0.0.1 mongo1 mongo2 mongo3`

### Keyfile Authentication

MongoDB replica sets require authentication between each node. The simplest authentication mechanism MongoDB supports
is [Keyfile Authentication](https://www.mongodb.com/docs/v4.2/tutorial/deploy-replica-set-with-keyfile-access-control/),
which is what is used here.

Generate a keyfile and place it in the same directory as `docker-compose.yml`. It will be mounted and
shared across the MongoDB containers. On Linux/WSL:

```
openssl rand -base64 700 > file.key
chmod 400 file.key
sudo chown 999:999 file.key
```
Note that MongoDB is very particular about the filesystem permissions and ownership of keyfiles.


## Running MongoDB with Debezium and Kafka

### Start the Containers

On the first start of the MongoDB containers, the replica set must be configured and the initial admin user must be created.

Start the containers:
```
docker compose up -d
```

### Configure MongoDB

Once the containers are up and running, run a script on `mongo1` to create the replica set and set `mongo1` as the primary:
```
docker exec mongo1 /scripts/mongo-rs-setup.sh
```

The containers should form a replica set after a few seconds.

The last step is to create a MongoDB admin user. MongoDB
allows the [primary node](https://www.mongodb.com/docs/v4.2/core/security-users/#localhost-exception) in a replica
set to create a single user if none exist.

Wait a few seconds before running this command. If `mongo1` is not yet the primary, you will get an error
to that effect and need to retry.
```
docker exec -e ADMIN_USERNAME=<username> -e ADMIN_PASSWORD=<password> mongo1 /scripts/mongo-user-setup.sh
```

### Browsing MongoDB

[MongoDB Compass](https://www.mongodb.com/docs/compass/current/) is a freely available UI tool
for browsing and importing data into MongoDB. `mongodb://<user>:<password>@mongo1:27017,mongo2:27018,mongo3:27019`
is the connection string to use for this MongoDB replica set.

### Viewing the MongoDB Logs

The logs for `mongo1`, `mongo2`, and `mongo3` can be found on docker volumes `mongo-log1`, `mongo-log2`,
and `mongo-log3` respectively. When not mounted to an active container, they can be browsed via the VS Code
Docker extension.

### Configure Debezium

The Debezium Kafka Connector must be configured with the MongoDB admin username and password to listen to
MongoDB change stream. To do this, copy the `debezium-mongodb.json.example` file to
`debezium-mongodb.json`. Edit the json file and insert the MongoDB admin username and password.
Then send the configuration to the Debezium Kafka Connector:
```
curl -i -X POST -H "Accept:application/json" -H  "Content-Type:application/json" http://localhost:8083/connectors/ -d @debezium-mongodb.json
```

### Browsing Kafka Topics and Messages

[Kafdrop](https://github.com/obsidiandynamics/kafdrop), a free Kafka Web UI, is bundled with this deployment.
Browse the Kafka instance with Kafdrop at `http://localhost:9000/`.

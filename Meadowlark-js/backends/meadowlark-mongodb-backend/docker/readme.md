# MongoDB Backend for Meadowlark

:exclamation: This solution should only be used on localhost with proper
firewalls around external network access to the workstation. Not appropriate for
production use.

This Docker Compose file provisions a 3-node replica set of MongoDB 4.0
instances on ports 27017, 27018, and 27019. It also provisions a Debezium
connection from the MongoDB replica set to a Kafka instance, along with a simple
Kafka browser. Note that while the MongoDB containers persist their data, in
this configuration the Debezium and Kafka containers are transient.

## MongoDB Preparatory Steps

### Local Hosts File

MongoDB replica sets require the hostname in the [connection
string](https://www.mongodb.com/docs/manual/reference/connection-string/) to
match the hostname of each node. Access to MongoDB from the host system requires
this hostname configuration. Because the container hostnames are mongo1, mongo2
and mongo3, add the following line to your hosts file:

```none
127.0.0.1 mongo1 mongo2 mongo3
```

### Keyfile Authentication

MongoDB replica sets require authentication between each node. The simplest
authentication mechanism MongoDB supports is [Keyfile
Authentication](https://www.mongodb.com/docs/v4.2/tutorial/deploy-replica-set-with-keyfile-access-control/),
which is what is used here.

## Running MongoDB with Debezium and Kafka

### Create a Shared Volume with Keyfile

The following commands use a temporary container to initialize the `mongo-auth` volume and
create a keyfile with the proper permissions. This durable volume will be shared by the MongoDB containers
at startup to enable Keyfile Authentication. Once the keyfile is created in the volume, the temporary
container is deleted. These commands should work on any operating system.

```bash
docker run -d --name mongo-temp -v mongo-auth:/auth mongo:4.0.28
docker exec mongo-temp mkdir /scripts
docker cp ./scripts/mongo-key-file-setup.sh mongo-temp:/scripts/mongo-key-file-setup.sh
docker exec mongo-temp chmod 777 /scripts/mongo-key-file-setup.sh
docker exec mongo-temp /scripts/mongo-key-file-setup.sh
docker rm -f mongo-temp
```

### Start the Containers

Start the containers:

```bash
docker compose up -d
```

### Configure MongoDB

On the first start of the MongoDB containers, the replica set must be configured
and the initial admin user must be created. Once the containers are up and
running, run a script on `mongo1` to create the replica set and set `mongo1` as
the primary:

```bash
docker exec mongo1 /scripts/mongo-rs-setup.sh
```

The containers should form a replica set after a few seconds.

The last step is to create a MongoDB admin user. MongoDB allows the [primary
node](https://www.mongodb.com/docs/v4.2/core/security-users/#localhost-exception)
in a replica set to create a single user if none exist.

Wait a few seconds before running this command. If `mongo1` is not yet the
primary, you will get an error to that effect and need to retry.

```bash
docker exec -e ADMIN_USERNAME=<username> -e ADMIN_PASSWORD=<password> mongo1 /scripts/mongo-user-setup.sh
```

### Browsing MongoDB

[MongoDB Compass](https://www.mongodb.com/docs/compass/current/) is a freely
available UI tool for browsing and importing data into MongoDB.
`mongodb://<username>:<password>@mongo1:27017,mongo2:27018,mongo3:27019` is the
connection string to use for this MongoDB replica set.

### Viewing the MongoDB Logs

The logs for `mongo1`, `mongo2`, and `mongo3` can be found on docker volumes
`mongo-log1`, `mongo-log2`, and `mongo-log3` respectively. When not mounted to
an active container, they can be browsed via the VS Code Docker extension.

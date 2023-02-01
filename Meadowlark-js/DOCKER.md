TODO: ROUGH NOTES - to be cleaned up before merg to main.

Create a `.env-docker` file in `Meadowlark-js` with an oauth signing key. All
other parameters are currently hard coded in the docker compose file. Might
remove some of those hard-coded test credentials before completing this ticket.

### Create a Shared Volume with Keyfile

The following commands use a temporary container to initialize the `mongo-auth` volume and
create a keyfile with the proper permissions. This durable volume will be shared by the MongoDB containers
at startup to enable Keyfile Authentication. Once the keyfile is created in the volume, the temporary
container is deleted. These commands should work on any operating system.

```bash
docker run -d --name mongo-temp -v mongo-local-auth:/auth mongo:4.0.28
docker exec mongo-temp mkdir /scripts
docker cp ./backends/meadowlark-mongodb-backend/docker/scripts/mongo-key-file-setup.sh mongo-temp:/scripts/mongo-key-file-setup.sh
docker exec mongo-temp /scripts/mongo-key-file-setup.sh
docker rm -f mongo-temp
```

NOTE: that is using a default password, maybe we want to change.


```bash
docker compose --env-file .env-docker -v up
```

## Mongodb

TODO: research these warnings, remove them before the merge to main.

** WARNING: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine

** WARNING: You are running this process as the root user, which is not recommended.

** WARNING: /sys/kernel/mm/transparent_hugepage/enabled is 'always'.
We suggest setting it to 'never'

~~Did not find local replica set configuration document at startup;~~

### Configure MongoDB

On the first start of the MongoDB containers, the replica set must be configured
and the initial admin user must be created. Once the containers are up and
running, run a script on `mongo1` to create the replica set and set `mongo1` as
the primary:

```bash
docker cp ./backends/meadowlark-mongodb-backend/docker/scripts/ mongo1-local:/
docker exec mongo1-local /scripts/mongo-rs-setup.sh
#
# Wait a few seconds, and paste in an appropriate username and password
#
docker exec -e ADMIN_USERNAME=mongo -e ADMIN_PASSWORD=abcdefgh1! mongo1-local /scripts/mongo-user-setup.sh
```

The containers should form a replica set after a few seconds.

The last step is to create a MongoDB admin user. MongoDB allows the [primary
node](https://www.mongodb.com/docs/v4.2/core/security-users/#localhost-exception)
in a replica set to create a single user if none exist.

Wait a few seconds before running this command. If `mongo1` is not yet the
primary, you will get an error to that effect and need to retry.

```bash
docker exec -e ADMIN_USERNAME=<username> -e ADMIN_PASSWORD=<password> mongo1-local /scripts/mongo-user-setup.sh
```
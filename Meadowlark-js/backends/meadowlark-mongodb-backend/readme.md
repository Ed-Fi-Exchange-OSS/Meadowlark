# MongoDB Backend for Meadowlark

The MongoDB backend for Meadowlark requires the following environment variables:

`MONGO_URI` - The connection string to the MongoDB replica set. Typically it would look like:

`mongodb://<username>:<password>@mongo1:27017,mongo2:27018,mongo3:27019/meadowlark?replicaSet=rs0`


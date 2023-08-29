# Using Kafka for Event processing

To setup with Debezium and connect to MongoDB and OpenSearch, run the `docker compose up -d`. Then execute the following
steps:

## Configure Debezium (Source)

The Debezium Kafka Connector must be configured with the MongoDB admin username and password to listen to MongoDB change
stream. To do this, copy the `debezium-mongodb.json.example` file to `debezium-mongodb.json`. Edit the json file and insert
the MongoDB admin username and password. Then send the configuration to the Debezium Kafka Connector:

Linux:

```bash
curl -i -X POST -H "Accept:application/json" -H  "Content-Type:application/json" \
    http://localhost:8083/connectors/ -d @debezium-mongodb.json
```

Windows:

```pwsh
Invoke-RestMethod -Method Post -InFile .\debezium-mongodb.json `
    -uri http://localhost:8083/connectors/ -ContentType "application/json"
```

### Verify source configuration

To check that source connector is running, execute:

```bash
curl http://localhost:8083/connector-plugins | jq .
```

```pwsh
Invoke-RestMethod http://localhost:8083/connector-plugins | ConvertTo-Json | ConvertFrom-Json
```

This returns the debezium connector information.

## Send Kafka Events to OpenSearch (Sink)

The Debezium Kafka Connector must be configured with the OpenSearch admin username and password to send the data streams to opensearch. To do this, copy the `opensearch_sink.json.example` file to `opensearch_sink.json`. Edit the json file and insert
the connection username and password. Then send the configuration to the Debezium Kafka Connector:

Linux:

```bash
curl -i -X POST -H "Accept:application/json" -H  "Content-Type:application/json" \
    http://localhost:8084/connectors/ -d @opensearch_sink.json
```

Windows:

```pwsh
Invoke-RestMethod -Method Post -InFile .\opensearch_sink.json `
    -uri http://localhost:8084/connectors/ -ContentType "application/json"
```

### Verify sink configuration

To check that sink connector is running, execute:

```bash
curl http://localhost:8084/connector-plugins | jq .
```

```pwsh
Invoke-RestMethod http://localhost:8084/connector-plugins | ConvertTo-Json | ConvertFrom-Json
```

This returns the OpenSearch connector information.

### Browsing Kafka Topics and Messages

[Kafdrop](https://github.com/obsidiandynamics/kafdrop), a free Kafka Web UI, is
bundled with this deployment. Browse the Kafka instance with Kafdrop at
`http://localhost:9000/`.

### View Logs

To view logs and additional information, use the `kafka-console-consumer.sh` script inside kafka-connect:

```bash
docker exec -it kafka1 ./bin/kafka-console-consumer.sh --bootstrap-server 172.18.0.9:9092 --topic edfi.meadowlark.documents --from-beginning --max-messages 1 | jq .
```

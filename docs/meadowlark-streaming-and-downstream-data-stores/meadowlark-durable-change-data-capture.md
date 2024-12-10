# Meadowlark - Durable Change Data Capture

> [!WARNING]
> Not completed in Milestone 0.2.0 as previously desired. Some early work was done, but it was cut from scope in order to prioritize moving towards a pilot-testable 0.3.0 release.

## Overview

One outcome of Meadowlark 0.1.0 was the demonstration of value in using DynamoDB Streams to insert documents into OpenSearch and separately deliver to S3 for analytics. In Meadowlark 0.2.0, we expand this to publish Meadowlark documents as events to a durable [Kafka](https://kafka.apache.org/) event store to support a broader range of integration use cases. We plan for Meadowlark to emit change data capture messages for both the PostgreSQL and MongoDB datastores. This will also set the stage for [Meadowlark - Streaming to Filesystem](../meadowlark-streaming-and-downstream-data-stores/meadowlark-streaming-to-filesystem.md) and [Meadowlark - Materialized Views](../meadowlark-streaming-and-downstream-data-stores/meadowlark-materialized-views.md).

> [!TIP]
> Why Kafka?
>
> 1.  It is "durable" - that is, the messages stay around, like a transactional database log. This is useful for materialized views. If a Student document is posted to the API one day, and a StudentEducationOrganizationAssociation documented is posted two weeks later, then we want the stream processor that creates the materialized view to be able to read both objects from the streams, without having to requery some other data store.
> 2.  It is widely used by companies large and small.
> 3.  It is available on all cloud providers and on-premises.

## Streaming

### Kafka Topic

By default, Meadowlark will publish messages to the edfi.meadowlark.documents topic.

### Message Definition

There are two types of Meadowlark messages: upsert and delete. A Meadowlark upsert message is sent whenever a document is created or updated, and is defined as follows:

#### Message Primary Key

```json
{ "id": "<Meadowlark document id>" }
```

### Message Body

```json
{
  "id": "<Meadowlark document id>",
  "documentIdentity": [
    {
      "name": "<identity element name>",
      "value": "<identity element value>"
    },
    ...
  ],
  "projectName": "<MetaEd project name>",
  "resourceName": "<Meadowlark resource name>",
  "resourceVersion": "<Meadowlark resource version>",
  "edfiDoc": "<Complete API document>"
}
```

An example Meadowlark message body would look like:

```json
{
	"id": "t4JWTsagjhY4Ea-oIcXCeS7oqbNX9iWfPx6e-g",
	"documentIdentity": [
		{
			"name": "schoolReference.schoolId",
			"value": 123
		},
		{
			"name": "weekIdentifier",
			"value": "1st"
		}
	],
	"projectName": "Ed-Fi",
	"resourceName": "AcademicWeek",
	"resourceVersion": "3.3.1-b",
	"edfiDoc": {
		"schoolReference": {
			"schoolId": 123
		},
		"weekIdentifier": "1st",
		"beginDate": "2022-12-01",
		"endDate": "2022-12-31",
		"totalInstructionalDays": 30
	}
}
```

Meadowlark delete events are Kafka "tombstone" events, which have a message primary key but no body. This design allows for Kafka to be used in a finer-grained per-record retention mode, rather than the coarser-grained time-based retention mode. This enables Kafka to act as a durable message store that contains the entire Meadowlark state.

## Change Data Capture

### Debezium

Meadowlark 0.2.0 takes advantage of the popular [Debezium](https://debezium.io/) Kafka connector to enable Meadowlark message publication to Kafka. Debezium provides connectors to both MongoDB and PostgreSQL.

### Debezium MongoDB Implementation

Meadowlark 0.2.0 uses the Debezium [MongoDB connector](https://debezium.io/documentation/reference/stable/connectors/mongodb.html) to listen to the Meadowlark MongoDB change streams and emit Meadowlark messages.  Debezium connectors are very robust, and can use snapshotting to generate messages for datastore changes that happened even while the connector was inactive.

The challenge of using the Debezium connector is that by default it works with MongoDB by converting the full document into stringified JSON. Debezium does supply an optional transformer that will parse the JSON into a Kafka message body, but it is not compatible with Meadowlark's schema-less design. Because Kafka messages often have a schema, the transform embeds a full JSON schema in each message that it derives from the JSON message. Unfortunately, the transformer will crash if there is variance in the schema between documents.

As a result, we cannot get a perfectly shaped Meadowlark message with the built-in Debezium and Kafka Connect transforms. A custom Java transform will need to be created and deployed into the Kafka Connector container. This adds complexity that we will defer until later. For now, the messages emitted by Debezium have two differences from a well-formed Meadowlark message. The message body is stringified JSON rather than regular JSON, and because renaming stringified fields is not possible with built-in transforms,  the document id embedded in the document has the property “\_id” rather than “id”.

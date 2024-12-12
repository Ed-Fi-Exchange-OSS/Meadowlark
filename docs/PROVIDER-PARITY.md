# Meadowlark Provider Parity Analysis

As mentioned in the [Meadowlark Architecture](./architecture.md), Meadowlark was developed on Amazon Web Services (AWS),  but the principle was to only use AWS managed services that have an analogous option for other major providers. This would make it (relatively) easy to migrate from one platform to the other. On-premise options were also explored.

The Alliance, following community feedback, has strongly factored open source availability of technology components into its technology roadmap choices (e.g., the work to port the Ed-Fi ODS platform storage to PostgreSQL). This choice has played an important role in expanding availability of the platform and lowering costs. This principle is likely to play an important role if the Meadowlark project is expanded (e.g., move to MongoDB from provider-specific options).

This document reviews the services used and identifies the equivalent tools (or gaps) in Azure, Google Cloud, and on-premise.

| Purpose | AWS Service | Azure | Google | On-Premises | Additional Notes |
| --- | --- | --- | --- | --- | --- |
| Load balancing and reverse proxy | [​API Gateway](https://aws.amazon.com/api-gateway/) | [Azure Application Gateway](https://azure.microsoft.com/en-us/services/application-gateway/#overview) | [Cloud Endpoints](https://cloud.google.com/endpoints) | [NGiNX](https://www.nginx.com/), among others |   |
| Serverless Application | [AWS Lambda](https://aws.amazon.com/lambda/) | [Azure Functions](https://azure.microsoft.com/en-us/services/functions/#overview) | [Google Cloud Functions](https://www.dynatrace.com/monitoring/technologies/google-cloud-monitoring/google-cloud-functions/?utm_source=google&utm_medium=cpc&utm_term=google%20cloud%20functions&utm_campaign=us-cloud-monitoring&utm_content=none&gclid=Cj0KCQiAqbyNBhC2ARIsALDwAsCT7cIo5OA8gTYttkevTd2XvydoEsrmpGTwjb712qKJlVQeW_LKXcEaAiL2EALw_wcB&gclsrc=aw.ds) | [OpenFaas](https://www.openfaas.com/) or [Fn](http://fnproject.io/) | The Meadowloark application is written in Typescript using the [Serverless package](https://www.npmjs.com/package/serverless), making it theoretically easy to reuse these components with any platform's serverless functions. <br><br>Could consider refactoring to OpenFaas or Fn for one system that is cloud-agnostic (runs in Kubernetes and Docker, respectively). |
| Key-value data  store and Change Data Capture | [DynamoDB](https://aws.amazon.com/dynamodb/) with [DynamoDB Change Data Capture](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/streamsmain.html) | [CosmosDB](https://azure.microsoft.com/en-us/services/cosmos-db/#overview) in Cassandra API mode with [CosmosDB Change Feed with Azure Functions](https://docs.microsoft.com/en-us/azure/cosmos-db/change-feed-functions) | [Firestore](https://cloud.google.com/firestore) ❌ see note below about change streams | [Apache Cassandra](https://cassandra.apache.org/_/index.html) with [Cassandra Triggers](https://medium.com/rahasak/publish-events-from-cassandra-to-kafka-via-cassandra-triggers-59818dcf7eed) | See detailed info below |
| Search engine | [Amazon OpenSearch](https://aws.amazon.com/opensearch-service/) | [Elastic on Azure](https://azure.microsoft.com/en-us/overview/linux-on-azure/elastic/) | [Elastic on Google Cloud Platform](https://www.elastic.co/about/partners/google-cloud-platform) | Either [ElasticSearch](https://www.elastic.co/elastic-stack/) or [OpenSearch](https://opensearch.org) can run on-premises |   |

## Key-Value Data Detailed Notes

The differences may be great enough that some tweaking of the storage model may be required.

Switching to MongoDB may be a useful alternative, as it is available on all platforms:

* [Amazon DocumentDB](https://aws.amazon.com/documentdb/) with [Change Streams](https://docs.aws.amazon.com/documentdb/latest/developerguide/change_streams.html)
* Azure CosmosDB has a MongoDB mode
* [MongoDB Atlas](https://www.mongodb.com/atlas/database) running on any of the three
* MongoDB can also run on-premises, with [Change Data Capture Handlers](https://docs.mongodb.com/kafka-connector/current/sink-connector/fundamentals/change-data-capture/).

Another option would be to switch to Cassandra for a single database platform available on all providers

* [Amazon Keyspaces](https://aws.amazon.com/keyspaces/)
* CosmosDB
* [Astra DB](https://www.datastax.com/products/datastax-astra/) from DataStax, running on any of the three
* Cassandra can also run on-premises

## Gogle Firestore Warning

Google Firestore might not have a direct equivalent of Change Data Capture... at least, the searching for this does not turn up functionality that is clearly the same as with the other products. However, perhaps one of these techniques is capable of writing out to a stream: [Extend... with Cloud Functions](https://firebase.google.com/docs/firestore/extend-with-functions) or [onSnapshot](https://firebase.google.com/docs/firestore/query-data/listen).

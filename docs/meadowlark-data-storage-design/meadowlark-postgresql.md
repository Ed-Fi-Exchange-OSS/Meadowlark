# Meadowlark - PostgreSQL

## Introduction

PostgreSQL has [extensive support](https://www.postgresql.org/docs/current/datatype-json.html) for storing and querying JSON documents. In fact, it seems to fare very well compared to MongoDB for [features](https://community.sisense.com/t5/knowledge/postgres-vs-mongodb-for-storing-json-data-which-should-you/ta-p/111) and especially for [performance](https://www.enterprisedb.com/news/new-benchmarks-show-postgres-dominating-mongodb-varied-workloads). Each platform has its own advantages. For Meadowlark 0.2.0, the development team will implement CRUD operations using PostgreSQL in addition to [MongoDB](../meadowlark-data-storage-design/meadowlark-mongodb.md), thus enabling direct comparison of features and benefits, and demonstrating the flexibility inherent in the design of the Meadowlark code.

*Also see: [Meadowlark - Durable Change Data Capture](../../project-meadowlark-exploring-next-generation-technologies/meadowlark-streaming-and-downstream-data-stores/meadowlark-durable-change-data-capture.md) for more information on streaming data out to OpenSearch.*

## Design

### Overview

The PostgreSQL schema would be set up in a similar non-relational design to the other NoSQL designs, but take advantage of PostgreSQL's document store features. The basic principal continues that the API document is stored along with metadata to be used for existence/reference validation. Metadata would continue to be stored alongside the API document in columns. Fast document lookups continue to be done by id, constructed as before from API document project name, entity type, version and natural key. Transactions will again be used to check for existence/references before performing create/update/delete operations.

In order to simplify a PostgreSQL deployment, this design is flexible on the requirement of OpenSearch for queries. This also means change data capture streaming becomes optional.

Instead of using OpenSearch, a "standalone deployment" will take advantage of PostgreSQLs JSON inverted-index support. Rather than split the entities into separate tables, an additional index on `project_name/entity_type/entity_version`  will be required for query support. Once a deployment reaches the performance constraints of this design, all these indexes can be dropped and an Elastic/OpenSearch configuration introduced that will continue to use a single table design.

### **Documents** Table

This implementation will use a single table named Entity.

#### Columns

| Column Name | Data Type | Description |
| --- | --- | --- |
| `id` | bigserial | Synthetic primary key, analogous to MongoDB's `_id` |
| ​`document_id` | ​VARCHAR | A string hash derived from the project name, resource name, resource version and identity of the API document. This field will be a unique index on the collection.​ |
| `document_identity` | JSONB | The identity elements extracted from the API document. |
| `project_name` | VARCHAR | The MetaEd project name the API document resource is defined in e.g. "EdFi" for a data standard entity. |
| `resource_name` | VARCHAR | The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However, there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name. |
| `resource_version` | VARCHAR | The resource version as a string. This is the same as the MetaEd project version the entity is defined in e.g. "3.3.1-b" for a 3.3b data standard entity. |
| `is_descriptor` | Boolean | Indicator |
| `validated` | Boolean | Indicator |
| `edfi_doc` | JSONB | The Ed-Fi ODS/API document itself. |
| `createdBy` | VARCHAR(100) | name/ID of the client who created the record, for authorization usage. |

#### Indexes

* On `edfi_doc`  as a GIN jsonb\_path\_ops index - for query support in standalone deployment
* On project\_name & entity\_type & entity\_version - for query support in standalone deployment
  * Maybe separate b-tree index, maybe multi-column GIN with api\_doc. See [https://pganalyze.com/blog/gin-index](https://pganalyze.com/blog/gin-index)

### **References** Table

This implementation will also use a reference table for reference validation.

#### Columns

| Column Name | Data Type | Description |
| --- | --- | --- |
| `id` | bigserial | Synthetic primary key |
| parent\_document\_id | varying | The parent document's `id` (~ *foreign key*) |
| reference\_document\_id | varying | The child document's `id` (~ *document' natural key*) |

## **Existence** Table

This implementation will also use an existence table for validation. The existence table provides a way for documents that might have a super/sub class relationship (i.e. education organizations like school) to have multiple document id's that relate.

#### Columns

| Column Name | Data Type | Description |
| --- | --- | --- |
| `id` | bigserial | Synthetic primary key |
| document\_id | varying | The child document's `id` (~ *document' natural key*) |
| existence\_id | varying | The id that the document can also be identified as |

> [!TIP]
>
> Potential addition:
>
> |     |     |     |
> | --- | --- | --- |
> | document\_location | varying | JSONPath expression to the external reference in the parent document |
> Might be useful in API response metadata?

#### Indexes

Need to be able to look up references in both directions:

* `reference_to` - e.g. when trying to delete a resource, determine if there are any external references to it
* `reference_from` - e.g. when trying to delete a resource, also deletes its own references to a "parent" resource.

### Data Processing

#### Insert Transaction Steps

Inserting a new Entity document into the table will follow these steps:

* Check that id does not exist in Entity (indexed query)
* Check that external reference ids for the document all exist in Entity (index query per reference)
* Perform insert of document into Entity
* Perform insert of external references into Reference
* Perform insert of external references into Existence
* Perform insert of superclass references into Existence
* Note: PostgreSQL has upsert support, but we may need to know if the outcome was insert or update to return the correct API response.

#### Update Transaction Steps

Updating an existing Entity document into the table will follow these steps:

* Check that id exists in Entity (indexed query)
* Check that external reference ids for the document all exist in Entity (index query per reference)
* Perform update into Entity
* Perform replacement of prior external references in Reference (delete all old + insert)
* Perform replacement of prior external references in Existence (delete all old + insert)
* Note: PostgreSQL has upsert support, but we may need to know if the outcome was insert or update to return the correct API response.

#### Delete Transaction Steps

Deleting an existing Entity document from the table will follow these steps:

* Check that id exists in Entity (indexed query)
* Check that there are no external references in Existence for this id (indexed query)
* Perform delete

#### Queries

A PostgreSQL installation will operate in two modes. In standalone mode, get all and get-by-key queries will be done directly on PostgreSQL by project\_name/entity\_type/entity\_version plus the GIN-indexed api\_doc. In "normal" mode, get all and get-by-key queries will be serviced by OpenSearch/Elasticsearch via CDC streaming.

## Open Issues

Need a partioning / sharding paradigm for large databases. See [https://www.percona.com/blog/2019/05/24/an-overview-of-sharding-in-postgresql-and-how-it-relates-to-mongodbs/](https://www.percona.com/blog/2019/05/24/an-overview-of-sharding-in-postgresql-and-how-it-relates-to-mongodbs/)

## Alternative Design

An alternative design would be to create separate collections for each resource, with [indexes](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING) on each queryable field. This could mean that PostgreSQL could serve as a single engine for all API CRUD requests, without the need for OpenSearch.

The development team has not explored this in detail at this time.

> [!WARNING]
> This document is for discussion and general guidance. The implementation may vary as needed. The development team will endeavor to keep this document up-to-date, though working software remains a higher priority than comprehensive documentation.

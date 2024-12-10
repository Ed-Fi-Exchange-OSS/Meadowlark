# Meadowlark - MongoDB

## Introduction

In hindsight,  [DynamoDB](../meadowlark-data-storage-design/meadowlark-dynamodb.md) was a poor choice of data store for the first release of Meadowlark for two primary reasons:

* Except for a little-known open source implementation, it is entirely restricted to Amazon Web Services.
* The design model is interesting, but idiosyncratic.

MongoDB would have been a better starting point:

* It is supported, directly and/or through emulation, on all major cloud platforms and on-premises.
* It is a mature product, with strong documentation and design patterns.
* The scalability features, such as replication and sharding, are very attractive for large implementation.

There are other NoSQL databases with similar benefits and other attractive features, such as Couchbase. However, the support is less widespread, so it will not be investigated at this time.

Although it is one of the traditional relational databases, PostgreSQL has powerful built-in support for NoSQL operations. Because of the Ed-Fi community's growing adoption of PostgreSQL, it will be explored as an alternative to MongoDB. *See [Meadowlark - PostgreSQL](../meadowlark-data-storage-design/meadowlark-postgresql.md).*

*Also see: [Meadowlark - Durable Change Data Capture](../../project-meadowlark-exploring-next-generation-technologies/meadowlark-streaming-and-downstream-data-stores/meadowlark-durable-change-data-capture.md) for more information on streaming data out to OpenSearch.*

## Design

This proposal takes its cue from the team experience with DynamoDB. The basic principal continues that the API document is stored along with metadata to be used for existence/reference validation. However, instead of storing the metadata in columns it will be part of a single larger document. Fast document lookups continue to be done by id, constructed as before from API document project name, entity type, version and body. Transactions will again be used to check for existence/references before performing create/update/delete operations. The MongoDB version of reference validation for deletes is greatly simplified from the DynamoDB version by taking advantage of MongoDB's indexing features, in particular indexing of arrays.

> [!TIP]
> To support potential deployment to Amazon DocumentDB or Azure CosmosDB, all code and design should match the **[MongoDB 4.0 API](https://www.mongodb.com/docs/v4.0/)****.**

### Entity Collection

The MongoDB implementation will only need one collection, to be called Entity. The shape of the Entity document (all fields required):

* Standard attributes (also see [Meadowlark - Document Shape](../meadowlark-data-storage-design/meadowlark-document-shape.md))
  * `id` \- A string hash derived from the project name, resource name, resource version and identity of the API document. This field will be a unique index on the collection.
  * `documentIdentity` - The identity elements extracted from the API document.
  * `projectName` \-The MetaEd project name the API document resource is defined in e.g. "EdFi" for a data standard entity.
  * `resourceName` \- The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However, there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
  * `resourceVersion` - The resource version as a string. This is the same as the MetaEd project version the entity is defined in e.g. "3.3.1-b" for a 3.3b data standard entity.
  * `isDescriptor` - Boolean indicator.
  * `edfiDoc` \- The Ed-Fi ODS/API document itself.
  * `validated`  - Boolean indicator.
  * `createdBy`  - name/ID of the client who created the record, for authorization usage.
* MongoDB-specific attributes
  * `outRefs` \- An array of ids extracted from the ODS/API document for all externally referenced documents.
  * `existenceIds`  - An array of class and superclass identifier applicable to this document. See [Meadowlark - Referential Integrity in Document Databases](../meadowlark-data-storage-design/meadowlark-referential-integrity-in-document-databases.md).

#### Examples

**Example: Descriptor** Expand source

```json
{
    "_id" : "uPvxNzlTZfnIGtMKu9K-oxLPlippk7UNmoipow",
    "documentIdentity" : [
        {
            "name" : "descriptor",
            "value" : "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Local Education Agency"
        }
    ],
    "projectName" : "Ed-Fi",
    "resourceName" : "EducationOrganizationCategory",
    "resourceVersion" : "3.3.1-b",
    "isDescriptor" : true,
    "edfiDoc" : {
        "codeValue" : "Local Education Agency",
        "shortDescription" : "Local Education Agency",
        "description" : "Local Education Agency",
        "namespace" : "uri://ed-fi.org/EducationOrganizationCategoryDescriptor"
    },
    "existenceIds" : [
        "uPvxNzlTZfnIGtMKu9K-oxLPlippk7UNmoipow"
    ],
    "outRefs" : [],
    "validated" : true,
    "createdBy" : "super-great-SIS"
}
```

In the following example, there are two `existenceId`  values. You'll recognize ZAwidGBEGsnKxQ-V1ktoecnvJ8xceXjM1jMehQ as "this" document identifier. The plain text [document identifier](../meadowlark-data-storage-design/meadowlark-document-shape.md) is "**Ed-Fi#LocalEducationAgency#localEducationAgencyId=2231**".

The second value, 0bCeilWY\_p33iM0Z3wOqdI058gvNTmphi\_ZBJQ, is the document Id constructed as if this document where an EducationOrganization instead of a LocalEducationAgency. Thus the plain text document identifier is "**Ed-Fi#EducationOrganization#educationOrganizationId=2231**"

**Example: Local Education Agency** Expand source

```json
{
    "_id" : "ZAwidGBEGsnKxQ-V1ktoecnvJ8xceXjM1jMehQ",
    "documentIdentity" : [
        {
            "name" : "localEducationAgencyId",
            "value" : 2231
        }
    ],
    "projectName" : "Ed-Fi",
    "resourceName" : "LocalEducationAgency",
    "resourceVersion" : "3.3.1-b",
    "isDescriptor" : false,
    "edfiDoc" : {
        "localEducationAgencyId" : 2231,
        "nameOfInstitution" : "Grand Bend School District",
        "localEducationAgencyCategoryDescriptor" : "uri://ed-fi.org/LocalEducationAgencyCategoryDescriptor#Independent",
        "categories" : []
    },
    "existenceIds" : [
        "ZAwidGBEGsnKxQ-V1ktoecnvJ8xceXjM1jMehQ",
        "0bCeilWY_p33iM0Z3wOqdI058gvNTmphi_ZBJQ"
    ],
    "outRefs" : [],
    "validated" : true,
    "createdBy" : "super-great-SIS"
}
```

In the following example, note that the `outRefs`  array has the identifiers for a school and a student.

**Example: StudentInterventionAssociation, with References** Expand source

```json
{
    "_id" : "LCEK0AxHRDUHK-5LVBlQKIarJHE83o1dVNgKWA",
    "documentIdentity" : [
        {
            "name" : "interventionReference.educationOrganizationId",
            "value" : 123
        },
        {
            "name" : "interventionReference.interventionIdentificationCode",
            "value" : "111"
        },
        {
            "name" : "studentReference.studentUniqueId",
            "value" : "s0zf6d1123d3e"
        }
    ],
    "projectName" : "Ed-Fi",
    "resourceName" : "StudentInterventionAssociation",
    "resourceVersion" : "3.3.1-b",
    "isDescriptor" : false,
    "edfiDoc" : {
        "studentReference" : {
            "studentUniqueId" : "s0zf6d1123d3e"
        },
        "interventionReference" : {
            "interventionIdentificationCode" : "111",
            "educationOrganizationId" : 123
        }
    },
    "existenceIds" : [
        "LCEK0AxHRDUHK-5LVBlQKIarJHE83o1dVNgKWA"
    ],
    "outRefs" : [
        "M42GTJNsVAGX5EOOoa7U_EwZdbOhmSiAF9wehw",
        "kKOLuEZJWjsDhpDiJOQlryLw_JBvzQ5KXTF2xg"
    ],
    "validated" : false,
    "createdBy" : "super-great-SIS"
}
```

> [!TIP]
> If trying to query inside of an entity, or if trying to GET ALL by type in MongoDB, then separate collections would be better than a single collection. However, when using MongoDB we would still plan to have OpenSearch or ElasticSearch in the picture for those functions. Therefore a single "table" (collection) design is appropriate, and makes sharding easy.

### Insert Transaction Steps

Inserting a new Entity document into the collection will follow these steps:

* Check that id does not exist (indexed query)
* Check that external reference ids for the document all exist (index query per reference)
* Perform **up**sert

### Update Transaction Steps

Updating an existing Entity document into the collection will follow these steps:

* Check that id exists (indexed query)
* Check that external reference ids for the document all exist (index query per reference)
* Perform overwrite

### Delete Transaction Steps

Deleting an existing Entity document from the collection will follow these steps:

* Check that id exists (indexed query)
* Check that there are no out\_refs for this id (indexed query)
* Perform delete

### Queries

Get all and get-by-key queries will continue to be serviced by OpenSearch. See [Meadowlark - Durable Change Data Capture](../../project-meadowlark-exploring-next-generation-technologies/meadowlark-streaming-and-downstream-data-stores/meadowlark-durable-change-data-capture.md) for more information on how data will flow out to OpenSearch.

## Future Considerations

### Security

* Investigate adding security annotations based on indexable API document attributes
  * Examples: ownership field, extracted education organization field
*  Investigate using with CASL.js for attribute-based authorization

* [https://casl.js.org/v5/en](https://casl.js.org/v5/en)
* Slide deck intro: [CASL presentation by author](https://www.slideshare.net/SergiyStotskiy/casl-isomorphic-permission-managementpptx-207064469)

### Improve version migration support

Consider ways we might want to change the id design to make migrating to newer DS versions easier. For current design, id includes project name, entity type, version, and natural key.

Let's say a new DS version comes out and a Meadowlark implementation wants to upgrade documents to the newer DS version. Assume School is unchanged between two DS versions. From the API client perspective, it would be very nice if the School resource ids didn't change. However, in the current design it would have to because version is part of the id hash.

This may get into changes in how DS versions are incorporated into resource URLs, and/or doing versions per MongoDB collection so that id is unique within a collection?

## Alternative Design

An alternative design would be to create separate collections for each resource, with [indexes](https://www.mongodb.com/docs/v4.0/indexes/) on each queryable field. This could mean that MongoDB could serve as a single engine for all API CRUD requests, without the need for OpenSearch.

The development team has not explored this in detail at this time.

> [!WARNING]
> This document is for discussion and general guidance. The implementation may vary as needed. The development team will endeavor to keep this document up-to-date, though working software remains a higher priority than comprehensive documentation.

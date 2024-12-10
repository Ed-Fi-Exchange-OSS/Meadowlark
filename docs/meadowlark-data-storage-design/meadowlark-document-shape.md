# Meadowlark - Document Shape

## Overview

Meadowlark documents have a *baseline* standardized shape or scheme in data storage; however, some implementation details may vary by data storage provider. For example, the MongoDB implementation includes two arrays inside the document, which are stored as separate tables in PostgreSQL.

## Standard Elements

| Attribute Name | Description | Example |
| --- | --- | --- |
| ​**\_id** (Mongo) or<br><br>**id** (PostgreSQL) | A unique [document identifier](https://edfi.atlassian.net/wiki/spaces/EXCHANGE/pages/22498135/Meadowlark+-+Document+Shape#Meadowlark-DocumentShape-DocumentIdentifiersdocument-identifier), also known as the "Meadowlark ID". Used internally by the database engine. | ​ZAwidGBEGsnKxQ-V1ktoecnvJ8xceXjM1jMehQ |
| documentUuid | A unique and randomly-assigned [document identifier](https://edfi.atlassian.net/wiki/spaces/EXCHANGE/pages/22498135/Meadowlark+-+Document+Shape#Meadowlark-DocumentShape-DocumentIdentifiersdocument-identifier). Used externally by API clients | 3518d452-a7b7-4f1c-aa91-26ccc48cf4b8 |
| documentIdentity | Array of key-value pairs that make up the document identity, corresponding to the Natural Key in the Ed-Fi Data Standard | ```<br>[  <br>  {  <br>    "key": "localEducationAgencyId",  <br>    "value": "2231"  <br>  }  <br>]<br>``` |
| projectName | The project name from MetaEd<br><br>> [!TIP]<br>> Eventually this will allow Meadowlark to support Data Model extensions | Ed-Fi |
| resourceName | The name of the resource, corresponding to the domain entity name in the Ed-Fi Data Standard | LocalEducationAgency |
| resourceVersion | The Data Standard version<br><br>> [!TIP]<br>> Eventually this will allow Meadowlark to support multiple Data Standards in the same data store | 3.3.1-b |
| isDescriptor | Boolean | false |
| edfiDoc | The document body corresponding to the data model definition | ```<br>[  <br>  {  <br>    "localEducationAgencyId": "2231",<br>```<br>```<br>    "nameOfInstitution": "Grand Bend School District",  <br>    "localEducationAgencyCategoryDescriptor": <br>```<br>```<br>        "uri://ed-fi.org/LocalEducationAgencyCategoryDescriptor#Independent",  <br>    "categories": [ ]  <br>  }  <br>]<br>``` |

## Document Identifiers

Meadowlark items have two unique identifiers:

* The `id`  (aka "Meadowlark ID") value is a computed value based on the data standard version and data model natural key.
* The `documentUuid` is a v4 UUID (unique identifier) that is assigned at the time the item is first created in the API.

Early on in project Meadowlark, the application only used the computed `id` value above. This value makes it trivial to lookup a item in the data store, including for validating that a new item's references actually exist. It was also useful for allowing API clients to specify a particular resource to GET, PUT, or DELETE (e.g. `GET /ed-fi/localEducationAgency/ZAwidGBEGsnKxQ-V1ktoecnvJ8xceXjM1jMehQ` ).

It suffers from one glaring problem though: the natural key can change for some resource types. Implication: a changing natural key would change the `id`  value and thus break any *external* client integrations that stored that calculated ID. Thus the application needs a fully stable identifier for *external* usage. This external ID is the randomly/uniquely assigned `documentUuid` that does not change even if the natural key changes.

The following sequence diagram shows the differing internal and external uses of these two unique identifiers.

![](https://edfi.atlassian.net/wiki/plugins/servlet/confluence/placeholder/unknown-macro?name=drawio&locale=en_US&version=2)

### Meadowlark ID

The Meadowlark ID has a one-to-one unique match with the document, based on the data model project name, the resource name, and the natural key value(s). Because this could be rather large for some resources - for example, a StudentSectionAssociation resource - Meadowlark concatenates this information into a single string, calculates a hash value on it (using SHA3-224), and then encodes the result as a Base64 string. The keys are sorted alphanumerically before that concatenation, to guarantee a consistent ordering when there are multiple key fields.

Example: Course in the Ed-Fi Data Standard has a natural key composed of the `courseCode`  and the associated `educationOrganization`. The document identity is thus:

```json
[
  {
    "key": "courseCode",
    "value": "span-101"
  },
  {
    "key": "educationOrganizationReference.educationOrganizationId",
    "value": "123"
  }
]
```

To create a Meadowlark ID, the system concatenates this information into the following string and then hashes it:

```none
Ed-Fi#Course#courseCode=span-101#educationOrganizationReference.educationOrganizationId=123
```

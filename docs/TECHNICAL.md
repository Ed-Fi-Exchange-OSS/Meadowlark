# Meadowlark

## Resource Ids

Resource Ids are calculated from the fully qualified MetaEd entity type (project name, project version, entity name) and
natural key string. They are a 224 bit hash using SHA-3's SHAKE-128 algorithm as implemented by the jsSHA library.

The entity type string is of the form "TYPE#\<MetaEd project name>#$\<MetaEd project version>#\<MetaEd name>". The natural
key string is of the form "\<hash-separated key-value pairs>", where pairs are of the form "\<json document body
location>=\<value>" and pairs are in alphabetical order.

Document Ids are 56 character (224 bit) hex strings. For example: 6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7

## Authentication

Due to time constraints, the implementation contains a simple test harness with support for a few hard-coded key/secret
combinations. These key/secret pairs will support OAuth2 client credentials flow and create signed JSON Web Tokens (JWT) that
encode claim information. The claim information can then be used for authorization and record ownership. Please note that the
protection is incomplete; for example, it does not verify the `aud` in the token and the token won't expire until sometime in
the year 2091. It does, however, verify the signing key.

* Default token endpoint: `/{stage}/api/oauth/token`
* Verification endpoint (useful for debugging): `GET /{stage}/verify` with authorization header
* Create a random key for signing: `GET /stage/createKey` 
  * Place in the Meadowlark `.env`  file as SIGNING_KEY .
* Name of the vendor is stored in the subject.
* There are two hard-code key/secret pairs for different "vendors":
  | Key | Secret |
  | --- | ------ |
  | ​meadowlark_key_1 | meadowlark_secret_1 |
  | meadowlark_key_2 | meadowlark_secret_2 |

# MetaEd to ODS/API Surface

While Ed-Fi models are described using the MetaEd language, their most common expression is as the API surface of an
ODS/API implementation.  The mapping between MetaEd models and their API surface expression is largely straightforward,
but there are some important differences.

## Element Naming

### Casing

Names on the ODS/API surface are always lower camel cased, whereas names in MetaEd models are always upper camel cased.

### Simple Names

For the most part, the names of individual elements are the same between the MetaEd model and ODS/API surface.
MetaEd "role names" are expressed as prefixes on the property name.

### Name Overlap Collasping

The ODS/API surface has naming rules that remove overlapping prefixes of properties that match the parent entity name in some cases. As a simple example, a MetaEd property "XyzAbcd" on an entity "Xyz" may be expressed in the API as "Abcd". However, the rules for name collapsing can get quite involved in complex cases, and is beyond the scope of this document.

## References

In general, a reference on the ODS/API surface is made up of the set of individual natural key values that specify
the referenced entity. This set is wrapped by an object named "xyzReference", where "xyz" is the singularized name of the
entity being referred to.

### Reference Collections

Reference collections are arrays of single item references where the array is named as the pluralized name of the entity
being referred to.

### Descriptors

References to descriptors are suffixed by "Descriptor" instead of "Reference" like all other entity references.

## Choice and Inline Common

There are no direct equivalents to MetaEd Choice and Inline Common entities in the ODS/API. Instead, they are considered
more like bags of properties which are pulled up to the same level as the entity with the Choice/Inline Common reference.
Since references to Choice/Inline Common can be nested, the pull-up can happen from multiple levels.
# Meadowlark

## Resource Ids

Resource Ids are calculated from the fully qualified MetaEd entity type (project name, project version, entity name) and
natural key string. They are a 224 bit hash using SHA-3's SHAKE-128 algorithm as implemented by the jsSHA library.

The entity type string is of the form "TYPE#\<MetaEd project name>#$\<MetaEd project version>#\<MetaEd name>". The natural
key string is of the form "NK#\<hash-separated key-value pairs>", where pairs are of the form "\<json document body
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

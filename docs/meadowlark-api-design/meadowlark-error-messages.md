# Meadowlark - Error Messages

As of Meadowlark 0.4.0, this is a comprehensive list of the 400 and 500 ranges of error messages Meadowlark responds with along with the reasons for those responses. This does not include 500 Internal Server Error itself as these are internal failures for a variety of reasons, usually from third-party library exceptions. This also does not include various security-related reasons behind 404 responses.

## Authorization Failure

| Reason | HTTP Code | Message |
| --- | --- | --- |
| Invalid Authorization header | 400 | { error: 'Invalid authorization header' } |
| Provided JWT is not well-formed | 401 | None |
| Provided JWT is inactive | 401 | None |
| Oauth server is unreachable | 502 | None |
| Not authorized for the given document | 403 | None |

## Endpoint Validation

| Reason | HTTP Code | Message |
| --- | --- | --- |
| Resource endpoint is invalid | 404 | { error: 'Invalid resource XZY. The most similar resource is XYZ' } |

## Body Validation

| Reason | HTTP Code | Message |
| --- | --- | --- |
| No body on POST or PUT | 400 | { error: 'Missing body' } |
| Malformed body | 400 | { error: 'Malformed body: <<error from JSON.parse()>>' } |
| Malformed document UUID on PUT, GET, DELETE | 404 | None |
| JSON Schema validation failure | 400 | { error: \[<<validationError1>>, <<validationError2>>, …\] }  <br>where a validationError looks like { message: <<explains error>>, path: JSONPath, context: <<lower level validation library info>> } |
| Two document values must be equal but are not | 400 | { error: \['Constraint failure: document paths <<JSONPath1>> and <<JSONPath2>> must have the same values', …\] } |

## Query Validation

| Reason | HTTP Code | Message |
| --- | --- | --- |
| Limit and offset must be non-negative | 400 | {error: 'Must be set to a numeric value >= 0'} |
| Limit required with offset | 400 | {error: 'Limit must be provided when using offset'} |
| Query includes property not on resource | 400 | { error: 'The request is invalid.', modelState: \['<<ResourceName>> does not include property <<InvalidPropertyName>>**', …**\] } |
| Query server is unreachable | 502 | None |

## Delete Failure

| Backend Response Error | Reason | HTTP Code | Message |
| --- | --- | --- | --- |
| DELETE\_FAILURE\_REFERENCE | Attempt to delete document referenced by other documents | 409 | { error: { message: 'The resource cannot be deleted because it is a dependency of other documents', blockingUris: \['/v5.0-pre.2/edfi/students/a-referencing-document-uuid', …\] |
| DELETE\_FAILURE\_WRITE\_CONFLICT | Attempt to modify a document in a transaction that a concurrent transaction has modified | 404 | { error: { message: 'Write conflict due to concurrent access to this or related resources' } |

## Update Failure

| Backend Response Error | Reason | HTTP Code | Message |
| --- | --- | --- | --- |
| \-  | Id not in URL | 400 | None |
| \-  | Id field in document does not match id in URL | 400 | { error: { message:  'The identity of the resource does not match the identity in the updated document.' } |
| UPDATE\_FAILURE\_REFERENCE | Submitted document references one or more non-existent documents | 409 | { error: { message: 'Reference validation failed', failures: \[ {resourceName: 'Student', identity: { studentId: '123' }, …\] } } |
| UPDATE\_FAILURE\_IMMUTABLE\_IDENTITY | Attempt to modify document identity on a resource where the identity cannot be changed | 400 | { error: { message: 'The identity fields of the document cannot be modified' } } |
| UPDATE\_FAILURE\_CONFLICT | Attempt to change the identity of a document to the identity of an existing document with the same resource superclass | 409 | { error: { message: 'Update failed: the identity is in use by 'School' which is also a(n) 'EducationOrganization', blockingUris:  \['/v5.0-pre.2/edfi/schools/a-school-document-with-same-identity', …\] } } |
| UPDATE\_FAILURE\_WRITE\_CONFLICT | Attempt to modify a document in a transaction that a concurrent transaction has modified | 409 | { error: { message: 'Write conflict due to concurrent access to this or related resources' } |

## Upsert Failure

| Backend Response Error | Reason | HTTP Code | Message |
| --- | --- | --- | --- |
| UPDATE\_FAILURE\_REFERENCE /<br><br>INSERT\_FAILURE\_REFERENCE | Submitted document references one or more non-existent documents | 409 | { error: { message: 'Reference validation failed', failures: \[ {resourceName: 'Student', identity: { studentId: '123' }, …\] } } |
| INSERT\_FAILURE\_CONFLICT | Attempt to insert a document with the identity of an existing document with the same resource superclass | 409 | { error: { message: 'Insert failed: the identity is in use by 'School' which is also a(n) 'EducationOrganization', blockingUris:  \['/v5.0-pre.2/edfi/schools/a-school-document-with-same-identity', …\] } } |
| UPSERT\_FAILURE\_WRITE\_CONFLICT | Attempt to modify a document in a transaction that a concurrent transaction has modified | 409 | { error: { message: 'Write conflict due to concurrent access to this or related resources' } |

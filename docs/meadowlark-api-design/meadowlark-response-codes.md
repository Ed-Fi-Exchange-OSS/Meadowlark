# Meadowlark - Response Codes

The Meadowlark API emit the following response codes:

| Verb | Code | Scenario | How to Resolve |
| --- | --- | --- | --- |
| All | 500 | Internal server error - something unexpected happen inside the server, which the API client can't resolve. | System administrator should inspect logs to troubleshoot and try to correct the error. |
| GET | ​200 "OK" | Request was accepted and an appropriate response returned.<br><br>> [!TIP]<br>> When performing a query, as opposed to getting a specific resource, the response will be an empty array with 200 status code if there are no documents to return, rather than a 404 "not found". | n/a​ |
| GET | 400 "Bad Request" | Invalid query string parameters | Client should inspect and correct the query string parameters |
| GET | 404 "Not Found" | The requested item does not exist. | Client may have stored a resource identifier incorrectly, and may need to lookup *all records* to find the right identifier. |
| POST | 200 "OK" | A POST request on an *existing*  item ("upsert") was processed successfully. | n/a |
| POST | 201 "Created" | The new item has been created. | n/a |
| POST | 400 "Bad Request" | The submitted document is not valid. For example:<br><br>*Invalid content-type header<br>*   Bad document format (invalid JSON)<br>*A missing property<br>*   A property with invalid data type<br><br>The response body will have a detailed message describing the error. | Client needs to inspect the detailed message and likely needs to make code-level corrections. |
| POST | 404 "Not Found" | The resource (i.e. Ed-Fi entity) does not exist | Client needs to check the URL for a typo. Can check the Open API specification - available through the root endpoint - for a list of available resources. |
| POST | 409 "Conflict" | Cannot insert or update the item, because of a missing reference (e.g. posted a StudentEducationOrganizationAssociation for a Student that does not exist yet).<br><br>or, Cannot insert the item, because the natural key already exists on a different entity in the same superclass hierarchy (e.g. cannot create a Local Education Agency with a `localEducationAgencyId`  that matches an existing School's `schoolId` ).<br><br>The response body describes the missing reference(s). | Client needs to insert the "upstream" reference first before re-trying. |
| PUT | 204 "No Content" | The item has been updated, and the response body does not contain any content. | n/a |
| PUT | 400 "Bad Request" | The submitted document is not valid. For example:<br><br>*Invalid content-type header<br>*   Bad document format (invalid JSON)<br>*A missing property<br>*   A property with invalid data type<br><br>The response body will have a detailed message describing the error. | Client needs to inspect the detailed message and likely needs to make code-level corrections. |
| PUT | 404 "Not Found" | The resource (i.e. Ed-Fi entity) does not exist, *or* the specific item does not exist | Client needs to check the URL for a typo. Can check the Open API specification - available through the root endpoint - for a list of available resources. |
| PUT | 409 "Conflict" | Cannot update the item, because of a missing reference (e.g. posted a StudentEducationOrganizationAssociation for a Student that does not exist yet).<br><br>The response body describes the missing reference(s). | Client needs to insert the "upstream" reference first before re-trying. |
| DELETE | 204 "No Content" | The item has been deleted, and the response body does not contain any content. | n/a |
| DELETE | 404 "Not Found" | The resource (i.e. Ed-Fi entity) does not exist, *or* the specific item does not exist | Client needs to check the URL for a typo. Can check the Open API specification - available through the root endpoint - for a list of available resources. |
| DELETE | 409 "Conflict" | Cannot delete the item, because it is a dependency of another item (e.g. cannot delete a Student if there is a StudentEducationOrganizationAssociation that references that student).<br><br>The conflict is described in the payload. | Client can either delete the "upstream" dependency first, or abandon the effort to delete the item. |

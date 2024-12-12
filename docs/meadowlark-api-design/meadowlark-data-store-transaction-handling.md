# Meadowlark - Data Store Transaction Handling

## Design Question

Meadowlark's backend design pattern relies on document-oriented datastores that provide atomic transaction support. As such, there are times when an incoming request will fail due to race conditions / locking. How should Meadowlark handle these failures?

## Scenarios for a Single Resource

Due to [Meadowlark's ownership authorization model](../meadowlark-security/meadowlark-data-authorization.md), these scenarios cannot occur for two different Client ID's trying to access the same resource. However, there exists a possibility that two different application threads could be operating in parallel with the same Client ID.

### Upsert Failure Due to Delete

* Thread A submits an update request for a particular resource via a POST request (upsert)
* Thread B submits a delete request for that same resource
* Thread B's request starts processing before Client A's.

The scenario may sound implausible at first, but consider this possibility: instead of sending a PUT request to update a record, one client application might submit a DELETE and then a POST request. If these requests are several seconds apart, then most likely they will succeed: the record is deleted, and then a new one is inserted.

However, there is a remote possibility that the requests are processed so close in time that the POST request fails because the DELETE is still processing.

In this case, it would be appropriate to retry the request rather than simply sending a failure message back to the client. The number of retries could be configurable, with a default value of 1. If the retry(ies) fail, then responding with 409 "conflict" would be sensible.

→ RETRY, 409

### Update Failure Due to Delete

Similar to the the scenario above (Upsert Failure Due to Delete), except with a PUT request instead of a POST request. In this case, it would be more appropriate to respond to the client with 404 "does not exist".

→ 404

## Scenarios Around Reference Checks

These scenarios could be from parallel threads using the same Client ID, or from two different Client ID's: referential integrity checks are independent of the authorization scheme.

### Delete Failure Due to New Reference

* Thread A submits a delete request for a particular resource
* Thread B submits a separate request that has a reference to the to-be-deleted resource
* Thread B's request completes before Thread A

This should result in a 409 "conflict" response with an appropriate message indicating that the resource is not deletable, unless a lock timeout occurred. If there was a lock timeout, a retry would be appropriate.

→ RETRY, 409

### Update Failure Due to Deleted Reference

The backend code logic should be locking reference records so that they cannot be deleted in the scope of the transaction, see [Meadowlark - Referential Integrity in Document Databases](../../project-meadowlark-exploring-next-generation-technologies/meadowlark-data-storage-design/meadowlark-referential-integrity-in-document-databases.md).

### Solution

If the transaction fails due to a lock, retry it N times. N should be configurable, but default to 1 (retry once). Zero should be a valid configuration ("do not retry transaction").

Then ensure that 409 is the response if retry fails.

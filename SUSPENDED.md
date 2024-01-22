# Meadowlark Project Suspended

As of January 2024, Project Meadowlark has been suspended. The following is information on the state of the project.

## Milestone 0.5.0

- Security improvements were implemented based on December 2023 security audit recommendations.
- Meadowlark can now be launched in a Kubernetes pod.
- Additional ODS/API parity improvements were made.

## Missing features/bugs

- A very small number of minor ODS/API parity issues remain. Addressing these has been moved to the MetaEd project.

- Document identity update cascade is not currently implemented. When a document identity is changed on a resource that allows changes, other documents that refer to that document must have their document references changed, both for reference validation but also in the document JSON itself. The design for this is for reference validation consistency to be made immediately but document JSON changes to be made asynchronously.

- Delete of an existing document that the client is not authorized for results in a 403. It should be 404 to hide document existence.

- MongoDB: Under load, when update conflicts result in a timeout the code calls abortTransaction twice when it should only be called once, resulting in an error.

- PostgreSQL: Meadowlark uses NOWAIT to avoid locking, instead reling on retries. Under load, the retries seem to be failing on the aliases table enough such that a 500 error is returned.

## Desirable features

- MongoDB performance needs improvement. Tuning requires the help of more experienced MongoDB users.

- PostgreSQL performance is similar to ODS/API, but improvement may be possible by changing reference validation to use PostgreSQL referential integrity on the references/aliases tables.

- While Meadowlark can use Debezium to stream changes to Kafka, this has not be well tested. Meadowlark also needs to standardize the Kafka message format.

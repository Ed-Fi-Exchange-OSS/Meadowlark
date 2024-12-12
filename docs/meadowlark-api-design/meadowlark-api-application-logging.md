# Meadowlark - API Application Logging

## Purpose

This document describes the logging policy in the Meadowlark API source code. In general, this policy seeks to balance the goals of providing sufficient information for an administrator to understand the health of the system and understand user interaction with the system with the equally important goals of protecting sensitive data and avoiding excessive log storage size.

## Logging Principles

* Use structured logging for integration into log-monitoring applications (LogStash, Splunk, CloudWatch, etc.).
* Do not log sensitive data.
* Use an appropriate log level.
* Include a correlation / trace ID wherever possible, with the ID being unique to each HTTP request.
* Provide enough information to help someone understand what is going on in the system, and where, but
* Be careful not to make the log entries too large, thus becoming a storage problem.
* Logs will be written to the console, at minimum.
* If any transformation or business logic is necessary for writing an info or debug message, use the utility `isDebugEnabled`  and `isInfoEnabled`  functions first before executing that logic.

## Log Levels

### Summary

Meadowlark will utilize the following levels when logging messages. These levels help the reader to understand if any remedial action is needed, and they allow the administrator to tune the amount of data being logged.

| Level | Description | Actionable |
| --- | --- | --- |
| ​ERROR | Either:<br><br>*Something unexpected occurred in code, which interrupts service in some way, or<br>*   An error occurred in an external service, for example, a database server was down. | Yes:<br><br>*Submit a bug report with the Ed-Fi team ([How To: Get Technical Help or Provide Feedback](https://edfi.atlassian.net/wiki/spaces/ETKB/pages/20874815/How+To%3A+Get+Technical+Help+or+Provide+Feedback))<br>*   Investigate the external service; report error to service provider if applicable |
| WARN | Something unexpected occurred in code, but the system is able to recover and continue. | If you see this happening frequently, consider submitting a detailed report as a Tracker ticket. There may be an opportunity for improving the code and/or providing better error handling for the situation. |
| INFO | Displays information about the state of an HTTP request, for example, which function is currently processing the request. | No  |
| DEBUG | Displays additional information about the state of an HTTP request and/or state of responses from external services.<br><br>Includes anonymized HTTP request payloads for debugging integration problems. | No  |

> [!TIP]
> See below for more information on how this anonymization would work in DEBUG logging.
> When vendor API clients encounter data integration failures, the support teams often want to know what payload failed, and this information is not always readily available from the maintainers of the client application. Providing anonymized payloads meets the support need "half way" in that the system administrator and/or a support team member can see the *structure* of the messages sent, without being able to see the detailed *content*. In many cases, this will be sufficient to understand why a request failed.

### Examples

These examples are general guidelines and not 100% exhaustive.

#### Error

* Unhandled null reference
* Database connection / transaction failure after exhausting retry attempts

#### Warning

* A database connection / transaction failure occurred, but was recovered with an automatic retry

#### Informational

* Received an HTTP request
  * URL
  * clientId
  * traceId
  * verb
  * contentType
  * *no payload*
* Responded to an HTTP request
  * URL
  * response code
  * clientId
  * duration from time of receipt of HTTP request to response (milliseconds)
  * *no payload*
* Process startup and shutdown
* Database created

#### Debug

* Received an HTTP request → add anonymized payload
  * Replace potentially sensitive string and numeric data with `null`  before logging.
  * Could hard code restrictions to "known-to-be-sensitive" attributes, for example attributes on Student, Parent, and Staff.
  * However, that could fall short with a change to the data model.
  * Therefore, it will be safest to replace all string and numeric data.
  * One potential exception: descriptors.
    * descriptor values will never contain sensitive data;
    * since the other string and numeric values are anonymized, the descriptor value itself does not provide a side channel to sensitive information;
    * there is value to having this when debugging failed HTTP requests.
* Responded  to an HTTP request → add payload
  * Will require anonymization of the natural key fields when reporting a referential integrity problem

        > [!INFO]
        > Potential scenario:
        > * Entity1 has natural key {personName, personId}.
        > * Entity2 has a reference to Entity1
        > * Post Entity2 with a {personName, personId} that do not exist. Then the response message will have `is missing identity {\"personName\": \"the actual value\", \"personId\": ... }`

* Entered a function
* About to connect to a service or run through an interesting algorithm
* Received information back from a service
  * Metadata only

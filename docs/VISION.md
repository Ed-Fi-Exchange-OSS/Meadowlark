# What is Meadowlark?

Project Meadowlark is a research and development (R&D) project. It is not a project to develop a "next gen" platform but rather to inform community conversations and  inform future development.

The goal of the Meadowlark project is to look for **technology accelerators** for the current strategy of near-real time data collection and aggregation via standards-based API exchanges from vendor systems and into a central data platform, in order to support analytics to improve the performance of students.

The Meadowlark code and releases provide a deployable, distributable, proof-of-concept for a cloud-native (i.e., built on cloud services) implementation of the Ed-Fi API surface. It therefore replicates the data collection capabilities of the Ed-Fi ODS/API, but does not replicate the database structure and storage of the ODS/API.

## What is it?

A research and development effort to explore *potential* for use of new technologies, including managed cloud services, for starting up an Ed-Fi compatible API.

## It is not…

A replacement for the Ed-Fi ODS/API. Portions of it could someday become a replacement, but we are not there.

## Research Questions

Some of the questions to be explored in this project include:

*   Can we build an API application that supports multiple data standards without requiring substantial coding work for each revision of the standard?
*   Can an Ed-Fi API promote events to a first-class concept, supporting notifications, subscriptions, and real-time data transformations?
*   How much might a fully cloud-native architecture cost to operate?
*   Is it feasible to build a system that is both cloud-native and fully operational on-premises?
*   What are the most important features and security models for unlocking widespread deployment across the education sector?

## End State Architecture

Taken to its logical conclusion, the end state architecture for Meadowlark would be more of a framework than a monolithic "product", with many different, competing, components that could be substituted into the system to perform designated functions. For example, the Ed-Fi API is an HTTP-based service with many possible implementations. The initial implementation uses AWS Lambda Functions. Alternate implementations could use a stand-alone NodeJs web server - such as Express or Fastify - or could implement the HTTP services in the functional framework for Azure, Google Cloud, etc.

The following diagram deliberately mixes-and-matches generic icon and icons from Amazon Web Services, Google Cloud Platform, Microsoft Azure - thus representing that the desired architecture is meant to be dynamic, pluggable, and platform-agnostic.

~[Meadowlark architecture diagram](../images/meadowlark-architecture.png)

## General Principles

1.  Prefer open source components or protocols.
2.  Code with strong separation of concerns in mind, enabling common business logic to be interact with multiple front-end (HTTP) and back-end (data store) components.
3.  Provide enough testing to prove viability, but not so much as would be required for a production-ready product.
4.  Evolution toward an (database-first) Event-Driven Architecture.

## Articles

* [Architecture](./ARCHITECTURE.md)
* [Parity Gaps](./PARITY-GAPS.md)
* [Meadowlark Provider Parity Analysis](./PROVIDER-PARITY.md)
* [Other Findings and Questions](./FINDINGS-AND-QUESTIONS.md)

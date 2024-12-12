# Meadowlark Use Cases

## Use Cases

The initial use cases targeted by Meadowlark are focused on K12 local education agencies (LEAs) and student information systems data. 

The use cases targeted initially by Meadowlark are:

“*As a LEA collaborative or service provider to an LEA, I need to aggregate the most critical student performance data in order to be able to understand the efficacy of and make changes to my school district curricular programs”*

“*As a LEA collaborative or service provider to an LEA, I want to be able to unblock myself when I encounter problems in the platform by modifying and contributing to the Ed-Fi platform solution”*

These represent a *subset* of the current market problems and functionality delivered by the Ed-Fi ODS/API. This narrowing of overall Ed-Fi use cases was made to limit the complexity and scope of the project, and does not reflect any intentions about future investments in other use cases not included here.

## Functional Areas

Meadowlark focuses on two functions of the current Ed-Fi ODS platform:

### Ed-Fi API surface

On the first of these, API implementation, Meadowlark provides an API that is designed to mimic the Ed-Fi ODS API and to meet the published Ed-Fi API specifications. We refer to this as "API parity", and addressing this parity was by far the largest focus of the project.

In some cases, the project decided not to pursue full parity with the current ODS API or the specifications. The reasons for this vary, but do not individually suggest that there are any "blockers" to using cloud technology services as the basis for an Ed-Fi  data exchange architecture.  Gaps to API parity are covered in this document: [API Parity Gaps](./PARITY-GAPS.md)

### Support for data management and analytics

The second focus was on how that data (once loaded from a vendor system) could be used by an education agency (which was – given the use cases above – an LEA).

In the Ed-Fi ODS platform, the native storage of data sourced from vendor systems is a relational database, and this provides infrastructure that LEAs can use to query and further transform the data.

Meadowlark takes a document-centric approach to the data loading, saving the native JSON documents into the transactional database. This eliminates the need to pre-define database schemas or to normalize data storage, thus lowering the amount of code required and improving query performance. However, this storage format is likely not useful for agencies seeking to perform analytics. Meadowlark therefore explored how to enable downstream usage.

> [!WARNING]
> To test out Meadowlark on your own:
>
> 1.  Make sure that you have an AWS subscription and a user account with permissions to create resources.
> 2.  Must have [Node.js 1](https://nodejs.org/)6 installed locally to manage the deployment.
> 3.  Clone the [source code repository](https://github.com/Ed-Fi-Exchange-OSS/Meadowlark/) using Git.
> 4.  Follow the [install instructions](https://github.com/Ed-Fi-Exchange-OSS/Meadowlark/tree/main/docs).

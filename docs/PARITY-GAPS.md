# Meadowlark and API Parity

## What is "API Parity"?

Meadowlark is designed to be implemented by the platform host and not cause breaking changes on the API client side:  to substitute the Ed-Fi API provided by Meadowlark with the API provided by the Ed-Fi ODS/API and have API clients continue to function (and not realize) that they were communicating with a different API. We refer to this as "API parity."

API parity for the project is defined in terms of the [Meadowlark Use Cases](./use-cases.md); that is, if a feature was not critical to satisfying one of these use case, it was generally left out. For example, extensibility, eTags ,and change queries are unquestionably useful for some API clients, but the belief is that the core Meadowlark use cases do not generally depend on these features, or that those features – if used – are nice-to-haves.

Such a calculus is imperfect:  there is always the possibility that some API client relies on a particular feature.

Broadly speaking, the proof-of-concept achieves API parity according to the definition above, but with some gaps. This document provides a list of the known gaps to API parity.

## Will these gaps be closed?

Some may, but it is unlikely that all such gaps will be closed.  Ed-Fi is an both an effort to build open source data infrastructure AND an effort to provide blueprints for standardize data flows. In respect of the latter goal of standardization, it is highly useful to compare API differences across API implementations: these are opportunities to understand better what needs to be standard and what does not.

Rather than try to close all these gaps, the goal should be to clearly define what API features are required and which should be allowed to vary. Doing so will allow for the development of alternative API implementations, whether through the open-source effort of the Ed-Fi community or through efforts independent outside of that community work.

## List of API Parity Gaps

### No extension support

Meadowlark does not support API extensibility.

Given that the Meadowlark use cases focus on LEA data sourcing where extensibility should not be needed, this features is unlikely to be prioritized.

Note however that the Alliance has looked to extensibility as a means to evolve the API interface, as in the case of the release of an early access, revised Finance API (see [ED-FI RFC 18 - FINANCE API](https://edfi.atlassian.net/wiki/spaces/EFDSRFC/pages/25363138/ED-FI+RFC+18+-+FINANCE+API)). If this pattern becomes standard practice, there will be more of an argument for the utility of such support.

### Support for "link" objects in JSON

In the ODS/API, the JSON is annotated by "link" elements that show the path to the element using a GET by the resource ID. These elements appear like this:

```json
"gradingPeriodReference": {
  "gradingPeriodDescriptor": "uri://ed-fi.org/GradingPeriodDescriptor#First Six Weeks",
  "periodSequence": 1,
  "schoolId": 255901001,
  "schoolYear": 2022,
  "link": {
    "rel": "GradingPeriod",
    "href": "/ed-fi/gradingPeriods/0d4a8d72801240fd805ee118b2641b0f"
  }
},
```

These elements do not appear in the GET elements provided by Meadowlark.

It is unlikely that these will be supported, and in general the direction is to continue to omit these from Ed-Fi API specifications.

*   The utility of these elements is doubtful: they seem to be an implementation feature/decision made by the ODS/API project and do not seem to be in wide use. The intention seems to be to deliver a HATEOS-type information to clients, but that model of interaction has generally not emerged as best practice in REST APIs.
*   Since Meadowlark takes a document-centric approach to collection and data management, annotating the documents would create additional complexity for any APIs of this kind; without compelling value for this feature, it was judged to be better to simply omit the feature.

### Support for "discriminator" fields on abstract class EducationOrganization

The ODS API provides for discriminators that inform the API client what specific subclass of a abstract class is being referenced. This is done via a "link" object that includes a "rel" field that indicates the class of the referent object. See below for an example of this on the /course API resource.

```json
{
    "id": "16904b88d3c144b4a43af2924f4c4590",
    "educationOrganizationReference": {
      "educationOrganizationId": 255901001,
      "link": {
        "rel": "School",
        "href": "/ed-fi/schools/c81a158d7caf49f299ff3c22b503b334"
      }
    },
    "courseCode": "03100500",
    "courseDefinedByDescriptor": "uri://ed-fi.org/CourseDefinedByDescriptor#SEA",
    "courseDescription": "Algebra I",
    ...
}
```

This feature was added to the ODS API in the interest of simplifying data usage for outbound/pulling API clients, especially for cases in which there is a high priority on API simplicity, as for the roster/enrollment API.

However, those use cases are not the focus of the initial Meadowlark scope, so it is unclear if this should be addressed. We will likely await further feedback, and if this emerges as a need, possibly look at other implementation options for solving the same problem (e.g., might it be better to ask a client to maintain a cache of EdOrgs, and possibly add support that allows them to do that more easily?). To insert the capability to annotate JSON documents would add complexity that is not clearly justified.

### Full authentication support

Meadowlark's current authentication is hard coded to two key/secret pairs and hard-coded claims.

If the project development continues, this would be a candidate for further development. However, as this authentication pattern is well-known, it is not seen as an element of the proof-of-concept that there is high value in exploring. Therefore, this is likely to be a lower priority.

### Over-posting: posting fields not part of the JSON schema

The Ed-Fi ODS API allows for extraneous fields to be posted without error; such fields are simply ignored. In Meadowlark, these are schema violations and a 4xx error is returned.

Allowing over-posting is generally a bad practice, as it often indicates the API client is not following the schema and can lead to hard to detect errors. However, over-posting can be employed as a simple API client strategy to support multiple versions of an API with less complexity.

This is likely not to be prioritized, given that this permissiveness has both pros and cons and which is more important is unclear.

> [!WARNING]
>
> To test out Meadowlark on your own:
> 1.  Make sure that you have an AWS subscription and a user account with permissions to create resources.
> 2.  Must have [Node.js 1](https://nodejs.org/)6 installed locally to manage the deployment.
> 3.  Clone the [source code repository](https://github.com/Ed-Fi-Exchange-OSS/Meadowlark/) using Git.
> 4.  Follow the [install instructions](https://github.com/Ed-Fi-Exchange-OSS/Meadowlark/tree/main/docs).

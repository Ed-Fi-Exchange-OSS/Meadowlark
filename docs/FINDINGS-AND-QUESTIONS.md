# Other Findings and Questions

The development of the Meadowlark proof-of-concept organically raised questions about alternative ODS API features or patterns that might support the Ed-Fi ecosystem equally well. This document discusses a few of these.

## Authorization

The ODS API's main authorization pattern is based on establishing relationships from resources to education organizations – subclasses of EducationOrganization, or EdOrg for short. API clients are assigned one or more EdOrgs and a strategy that specifies CRUD permissions over API classes for which specific resources can be traced to one of these EdOrgs.

This strategy is powerful and logical but also complex to implement. On the implementation side, each new authorization scheme needs to be driven by relational database views that materialize how each API resource can be traced to an EdOrg. Such views are custom code.

This strategy has also created complexity for API clients. As noted above, the relationships that drive authorizations are opaque and not easily presented to an API client. This strategy also results in strange interaction scenarios, such as the fact that a client cannot read a Student or Parent resource the client just wrote (because it has no relation to an EdOrg yet).

As noted above, this is not to say that the ODS API approach is wrong, but only that for some cases the complexity may not be justified. For example, in the case of a SIS client providing data to an API where the scope is a single LEA, these permissions probably suffice:

*   *For this particular API instance, your client has the ability to Create API resources for any of the following API classes:* *(list classes here)*
*   *For any resource you write, your client can also Read, Update or Delete that same resource.*

Implementing these rules is considerably simpler and demands no customized SQL or other materialized means to connect each resource to an EdOrg.

Clearly, in the context in which data is being read out of the API the ODS EdOrg authorization pattern becomes potentially much more useful.  But in many cases of data out – particularly early one – the scope of that authorization in field work still tends to be "all district data across these API resources for school year X"

In summary, the ODS API pattern of using EdOrg relationships to drive authorization is powerful and worth preserving, but the Meadowlark project suggests that a set of simpler patterns might eliminate complexity from many early field projects. As a implementation advances in complexity, an API host may choose to enable more powerful and complex designs.

## Validation Flexibility

The ODS API use of a relational database system for storage reduces the ability of the API to adapt to disparate validation needs. This can also be seen as a strength: the ODS API generally won't accept data that has met a fairly high benchmark for quality, and this has pushed data quality back to the source systems and responsibility for data quality back to vendors.

Meadowlark's architecture opens up new possibilities – simple to implement – for  more tunable validation. Using a document store means the product can annotate unvalidated documents for deferred validation, or provide annotations on "how validated" the document is, e.g. support Level 2-style validation as an add-on. 

Of course, at issue here is understanding when (if ever) it is appropriate to lower data validation requirements for dating coming in via API. 

## Native Storage to Support Eventing

The ability to retain a JSON document opens many possibilities for downstream processing and eventing. As a document posted to the API represents a "one logical event" in the operations of an school district (e.g., "student X was marked absent on day Y"), the pre-packaging of that data opens up the possibility for other data consumers to consume it as a documents (e.g., the document could be posted to a log of attendance events to which other systems subscribe). Meadowlark itself uses this mechanism to index the documents in a search engine for query support.

The relational format of the ODS data storage delivers other benefits, such as the ability to perform complex validations based on SQL, so it is is not a case of one storage format is better than the other, but that there are use case benefits to each. Indeed, there are also certainly ways where both technologies could be mixed.

## Analytics Modules

The Meadowlark team experimented with downstream analytics processing using the above eventing mechanism. API documents were made accessible to AWS Athena, which allows for interactive queries with large-scale data sets. The team made simple visualizations from the API data in Athena with AWS QuickSight, the cloud-native BI tool.

In addition to QuickSight, tools like Power BI Desktop also include support for creating reports and dashboards driven by Athena. It would be interesting to create real use-case driven analytics modules that work with a Meadowlark framework designed for community extensibility.

## Reuse of Meadowlark Technology

Meadowlark makes use of MetaEd to generate API document schema validations and to locate natural key and foreign key references in API documents. Some of this is done in a "pre-processing" step that mirrors the behavior of a MetaEd plugin, while the rest is done at API invocation time. This could be moved entirely into MetaEd plugins that generate standard JSON Schema and JSONPath API data from a MetaEd model. This information could be used by the ODS/API platform, for example, to support its own schema validation.

This could also be part of a broader modularization of Meadowlark to enable extensions of Meadowlark created by the Ed-Fi community. With a clean separation of Meadowlark document validation and reference extraction from a web framework, alternatives like Azure Functions or even simple on-premise web application servers become possible. Similarly, separation of Meadowlark's back-end storage, querying and reference validation could allow for community-contributed alternatives like Azure Cosmos DB or local MongoDB instances.

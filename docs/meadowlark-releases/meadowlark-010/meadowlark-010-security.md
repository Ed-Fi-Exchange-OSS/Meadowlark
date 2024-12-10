# Meadowlark 0.1.0 - Security

# Authentication

Because OAuth2 is the desired authentication process, and it is a well-known and well-supported protocol, completing a full-blown authentication integration is a low-value task for this project.

To support authorization, there *is* a token endpoint with two hard-coded sets of client credentials. These will return a JSON Web Token (JWT) that should be used on all HTTP requests when authorization is enabled. The JWT is signed with a signing key, which must be provided via the `SIGNING_KEY` environment variable.

| Key | Secret |
| --- | --- |
| meadowlark\_key\_2 | meadowlark\_secret\_2 |
| ​meadowlark\_key\_1 | meadowlark\_secret\_1 |

# Authorization

## Implemented

The authorization requirement can be turned off with an environment variable, `ACCESS_TOKEN_REQUIRED`  (true or false). When true, "ownership" based authorization is enforced. This authorization enforces that the client who creates a resource is the only one who can access that resource. For the purpose of this project, this is seen as a minimum viable product showing that a resource-level restriction can be applied on GET, UPDATE, and DELETE requests.

## Commentary

The ODS API's main authorization pattern is based on establishing relationships from resources to education organizations – subclasses of EducationOrganization, or EdOrg for short. API clients are assigned one or more EdOrgs and a strategy that specifies CRUD permissions over API classes for which specific resources can be traced to one of these EdOrgs.

This strategy is powerful and logical but also complex to implement. On the implementation side, each new authorization scheme needs to be driven by relational database views that materialize how each API resource can be traced to an EdOrg. Such views are custom code.

This strategy has also created complexity for API clients. As noted above, the relationships that drive authorizations are opaque and not easily presented to an API client. This strategy also results in strange interaction scenarios, such as the fact that a client cannot read a Student or Parent resource the client just wrote (because it has no relation to an EdOrg yet).

As noted above, this is not to say that the ODS API approach is wrong, but only that for some cases the complexity may not be justified. For example, in the case of a SIS client providing data to an API where the scope is a single LEA, these permissions probably suffice:

*   *For this particular API instance, your client has the ability to Create API resources for any of the following API classes:* *(list classes here)*
*   *For any resource you write, your client can also Read, Update or Delete that same resource.*

Implementing these rules is considerably simpler and demands no customized SQL or other materialized means to connect each resource to an EdOrg.

Clearly, in the context in which data is being read out of the API the ODS EdOrg authorization pattern becomes potentially much more useful.  But in many cases of data out – particularly early one – the scope of that authorization in field work still tends to be "all district data across these API resources for school year X"

In summary, the ODS API pattern of using EdOrg relationships to drive authorization is powerful and worth preserving, but the Meadowlark project suggests that a set of simpler patterns might eliminate complexity from many early field projects. As a implementation advances in complexity, an API host may choose to enable more powerful and complex designs.

# Infrastructure

Because this is a research and development project, only minimal effort was put into securing the infrastructure. When deployed to Amazon, the team did try to keep access permissions to the minimum necessary to achieve the purpose. There was no attempt to minimize the database access permissions; for example, the Lambda functions can create tables and access all records. This may or may not be a desirable pattern in a real production system.

**Table of Contents**

*   [Authentication](#authentication)
*   [Authorization](#authorization)
    *   [Implemented](#implemented)
    *   [Commentary](#commentary)
*   [Infrastructure](#infrastructure)
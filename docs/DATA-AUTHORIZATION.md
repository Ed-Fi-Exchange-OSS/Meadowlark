# Data Authorization

## Meadowlark Authorization Modes

There are four authorization modes, described in the following sections.

### Ownership

Assign "vendor" to the roles for this default authorization model when creating the API client.

"Whoever creates a record has access to it". ClientA submits a POST request with a Student. ClientB guesses the document ID for that student and issues a GET request for it: access is denied. ClientA issues the same GET request: access granted, 200 response.

This does not affect validation: if ClientB submits a StudentEducationOrganizationAssociation with "ClientA's student", then the validation passes despite the fact that ClientB "cannot directly see" the student.

### Host Full Access

Assign "host" to the roles for this default authorization model when creating the API client.

This mode is intended for API hosting providers so that they can run synchronization processes, with access to read all documents unfiltered.

### Admin

Assign "admin" to the roles for this default authorization model when creating the API client.

This mode is specific to the internal OAuth2 provider and client management API, allowing the API client to create and manage other API clients.

### Assessment

Assign "assessment" to the roles for this default authorization model when creating the API client.

(warning) This is not a unique authorization model, and it should be used in addition to "vendor". This role allows the API client to bypass the usual reference validation checks when issuing a POST or PUT request.

## Descriptors

Regardless of the mode, all API clients need to know about available descriptors. At this time, all authenticated clients will be able to query for all descriptors.

## Meadowlark Authentication with OAuth2

Meadowlark uses OAUTH2. See [Meadowlark Authentication with OAuth2](OAUTH2.md) for more details.

## Background

The ODS API's main authorization pattern is based on establishing relationships from resources to education organizations – subclasses of EducationOrganization, or EdOrg for short. API clients are assigned one or more EdOrgs and a strategy that specifies CRUD permissions over API classes for which specific resources can be traced to one of these EdOrgs.

This strategy is powerful and logical but also complex to implement. On the implementation side, each new authorization scheme needs to be driven by relational database views that materialize how each API resource can be traced to an EdOrg. Such views are custom code.

This strategy has also created complexity for API clients. As noted above, the relationships that drive authorizations are opaque and not easily presented to an API client. This strategy also results in strange interaction scenarios, such as the fact that a client cannot read a Student or Parent resource the client just wrote (because it has no relation to an EdOrg yet).

As noted above, this is not to say that the ODS API approach is wrong, but only that for some cases the complexity may not be justified. For example, in the case of a SIS client providing data to an API where the scope is a single LEA, these permissions probably suffice:

* For this particular API instance, your client has the ability to Create API resources for any of the following API classes: (list classes here)
* For any resource you write, your client can also Read, Update or Delete that same resource.

Implementing these rules is considerably simpler and demands no customized SQL or other materialized means to connect each resource to an EdOrg.

Clearly, in the context in which data is being read out of the API the ODS EdOrg authorization pattern becomes potentially much more useful.  But in many cases of data out – particularly early one – the scope of that authorization in field work still tends to be "all district data across these API resources for school year X"

In summary, the ODS API pattern of using EdOrg relationships to drive authorization is powerful and worth preserving, but the Meadowlark project suggests that a set of simpler patterns might eliminate complexity from many early field projects.

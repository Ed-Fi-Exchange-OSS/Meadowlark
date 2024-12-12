# Meadowlark - Data Authorization

## Overview

The development team is exploring alternatives to the complex authorization schemes in the ODS/API.

* Milestone 0.1.0: only "ownership-based" authorization was supported.
* Milestone 0.2.0: added "full access" for hosting providers, and full access to descriptors.

## Meadowlark Authorization Modes

As described below, we will use the `roles`  claim in a JSON Web Token (JWT) to tell Meadowlark which authorization mode to use. There are four authorization modes, described in the following sections.

### Ownership

Assign "vendor" to the roles for this default authorization model [when creating](./meadowlark-authentication/meadowlark-internal-oauth-2-client-credential-provider.md) the API client.

"Whoever creates a record has access to it". ClientA submits a POST request with a Student. ClientB guesses the document ID for that student and issues a GET request for it: access is denied. ClientA issues the same GET request: access granted, 200 response.

This does not affect validation: if ClientB submits a StudentEducationOrganizationAssociation with "ClientA's student", then the validation passes despite the fact that ClientB "cannot directly see" the student.

Also see: [Meadowlark - Referential Integrity in Document Databases](../meadowlark-data-storage-design/meadowlark-referential-integrity-in-document-databases.md)

### Host Full Access

Assign "host" to the roles for this default authorization model [when creating](./meadowlark-authentication/meadowlark-internal-oauth-2-client-credential-provider.md) the API client.

This mode is intended for API hosting providers so that they can run synchronization processes, with access to read all documents unfiltered.

### Admin

Assign "admin" to the roles for this default authorization model [when creating](./meadowlark-authentication/meadowlark-internal-oauth-2-client-credential-provider.md) the API client.

This mode is specific to the internal OAuth2 provider and client management API, allowing the API client to create and manage other API clients.

### Assessment

Assign "assessment" to the roles for this default authorization model [when creating](./meadowlark-authentication/meadowlark-internal-oauth-2-client-credential-provider.md) the API client.

>[!WARNING]
>
> This is not a unique authorization model, and it should be used in addition to "vendor". This role allows the API client to bypass the usual referential integrity checks when issuing a POST or PUT request.

## Descriptors

Regardless of the mode, all API clients need to know about available descriptors. At this time, all authenticated clients will be able to query for all descriptors.

> [!WARNING]
> Descriptors have a concept of namespace for identifying which descriptors are used by which vendor. In Meadowlark this is, for now, on the honors system: there is no restriction on which namespaced descriptors any given client can use. This may change in the future.

## How It Will Work: JSON Web Token

Although we do not know the details of the Authentication software integration yet, we have already chosen to use [OAuth2](https://oauth.net/) as the protocol and [JSON Web Tokens](https://www.rfc-editor.org/rfc/rfc9068.html#name-roles) (JWT) as the format for access tokens. The type of authorization will be configured through the [`Roles`](https://www.rfc-editor.org/rfc/rfc9068.html#name-roles)  claim on the JWT; thus any third-party or integrated OAuth2 provider will need to support configuration of a "roles" claim. Initially, Meadowlark will support two mutually exclusive roles: Vendor and Host, subject to ownership-based authorization and full access, respectively. If other authorization modes are added in the future - for example, based on Person relationship or Local Education Agency ID - then additional claims may be needed to support those use cases.

As of Meadowlark 0.2.0, where authentication is hard-coded to a couple of tokens, the JWT is signed using the HMAC with SHA256 symmetric key algorithm. This will likely change to the RSA with SHA256 algorithm once third party OAuth2 providers are supported, so the authentication provider and the Ed-Fi API provider do not need to have access to a shared key.

Below is an example of a decoded (plain JSON) JWT from Meadowlark 0.2.0:

**Header block**

```json
{
  "typ": "JWT",
  "alg": "HS256"
}
```

**Payload**

```json
{
  "iss": "ed-fi-meadowlark",
  "aud": "meadowlark",
  "sub": "<vendor name>",
  "jti": "3d59b75f-a762-4baa-9116-19c82fdf8de3",
  "iat": 1636562060,
  "exp": 3845548881,
  "client_id": "fbf739c4-fb86-4f03-a477-91af51cc46f2",
  "roles": [ "vendor" ]
}
```

Explanation of each claim...

| Claim | Full description | Meaning |
| --- | --- | --- |
| ​iss | Issuer​ | The OAuth2 provider​ |
| aud | Audience | The application for which the token was issued |
| sub | Subject | The client for which the token was issued |
| jti | JWT Id | A unique identifier for the JWT |
| iat | Issued At | The Unix-style timestamp when the JWT was created |
| exp | Expiration Time | The Unix-style timestamp when the JWT should not longer be accepted ("expired") |
| client\_id | Client ID | Unique identifier for the client application |
| roles | Roles | An array of roles assigned to the client credentials that were used to generate the JWT. |

[https://datatracker.ietf.org/ipr/search/?rfc=9068&submit=rfc](https://datatracker.ietf.org/ipr/search/?rfc=9068&submit=rfc)

## Background

The ODS API's main authorization pattern is based on establishing relationships from resources to education organizations – subclasses of EducationOrganization, or EdOrg for short. API clients are assigned one or more EdOrgs and a strategy that specifies CRUD permissions over API classes for which specific resources can be traced to one of these EdOrgs.

This strategy is powerful and logical but also complex to implement. On the implementation side, each new authorization scheme needs to be driven by relational database views that materialize how each API resource can be traced to an EdOrg. Such views are custom code.

This strategy has also created complexity for API clients. As noted above, the relationships that drive authorizations are opaque and not easily presented to an API client. This strategy also results in strange interaction scenarios, such as the fact that a client cannot read a Student or Parent resource the client just wrote (because it has no relation to an EdOrg yet).

As noted above, this is not to say that the ODS API approach is wrong, but only that for some cases the complexity may not be justified. For example, in the case of a SIS client providing data to an API where the scope is a single LEA, these permissions probably suffice:

* *For this particular API instance, your client has the ability to Create API resources for any of the following API classes:* *(list classes here)*
* *For any resource you write, your client can also Read, Update or Delete that same resource.*

Implementing these rules is considerably simpler and demands no customized SQL or other materialized means to connect each resource to an EdOrg.

Clearly, in the context in which data is being read out of the API the ODS EdOrg authorization pattern becomes potentially much more useful.  But in many cases of data out – particularly early one – the scope of that authorization in field work still tends to be "all district data across these API resources for school year X"

In summary, the ODS API pattern of using EdOrg relationships to drive authorization is powerful and worth preserving, but the Meadowlark project suggests that a set of simpler patterns might eliminate complexity from many early field projects. As a implementation advances in complexity, an API host may choose to enable more powerful and complex designs.

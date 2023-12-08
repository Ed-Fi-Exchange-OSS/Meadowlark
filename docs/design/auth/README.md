# Client Authentication and Authorization for Meadowlark

This document introduces a proposed name for the core API application when
serving up the Ed-Fi Resources API, Descriptors API, and the "version endpoint"
(name of that API is pending): Meadowlark Data Management Service (DMS).

The Meadowlark DMS will enforce data privacy and security through use of OAuth
2.0 for authentication and claim management, and it will map OAuth claims  to
resource-level authorization. This document provides the requirements and design
for the full lifecycle of authentication and authorization.

## Core Requirements

1. Clients will authenticate client credentials flow with an [OAuth 2.0
   provider](https://www.rfc-editor.org/info/rfc6749), generating a [bearer
   token](https://www.rfc-editor.org/info/rfc6750).
2. The OAuth provider will fully own management of client credentials.
3. A Meadowlark Configuration Service (CS) will be responsible for storing any
   additional client configuration and Claimset metadata that are not otherwise
   stored in the OAuth provider.
4. A [yet-to-be-determined
   process](#options-for-token-usage-and-claim-management) will manage claim
   information for the client credentials, including:
   1. Assigned [Claimset](#claimsets) as a role name
   2. Education Organization(s) as [entitlements](#entitlements)
   3. Potentially, Grade Level(s) as entitlements.
5. On first receipt of a given token, the Meadowlark DMS will use an [OAuth
   token introspection](https://www.rfc-editor.org/info/rfc7662) request to
   verify that the token has not been revoked, and potentially to retrieve
   additional claim information.
6. The Meadowlark DMS will use the assigned Claimset to retrieve access
   privileges for API resources from an [Admin API](#admin-api) exposed through
   the Meadowlark CS.

(!) Looking for suggested improvement to the name "Configuration Service". This
service will house tenant, vendor, and application information, as well as
connection strings. At this time, it is not expected that running API instances
retrieve their other runtime settings from this service.

## Options for Token Usage and Claim Management

Three options are presented below: use of a plain string bearer token, and two
variations on use of a [JSON Web Token](https://www.rfc-editor.org/info/rfc7519)
(JWT). In all cases, the token will be connected to a Claimset name using the
`role` claim, and the detailed permission granted by that Claimset will be
stored in the Meadowlark Configuration Service.

### Option 1: Simple Bearer Token

Example HTTP response on successful authentication:

```json
{
  "access_token":"mF_9.B5f-4.1JqM",
  "token_type":"Bearer",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA"
}
```

In this scenario, the access token is a unique identifier that does not encode
any additional information. The client can store the expiration date, and can
use the refresh token to request a new access token on expiry of the original.

On initial receipt of the token, the the Meadowlark DMS will issue a token
introspection request to the OAuth provider. The response must return the basic
claims (including `role` and the entitlements for Education Organization ID(s)
and Grade Level(s)). Example introspection response:

```json
{
  "iss": "ed-fi-meadowlark",
  "aud": "ed-fi-meadowlark",
  "sub": "client name",
  "jti": "3d59b75f-a762-4baa-9116-19c82fdf8de3",
  "iat": 1636562060,
  "exp": 3845548881,
  "client_id": "fbf739c4-fb86-4f03-a477-91af51cc46f2",
  "roles": [ "vendor" ],
  "entitlements": [ { "educationOrganizations": [ 123 ], "gradeLevels": [9, 10] } ]
}
```

(Details about how to handle "entitlements" needs to be worked out with
additional investigation into how off-the-shelf tools can support this).

### Option 2: JSON Web Token

Example HTTP response on successful authentication:

```json
{
  "access_token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWFkb3dsYXJrIiwiYXVkIjoiZWQtZmktbWVhZG93bGFyayIsInN1YiI6ImNsaWVudCBuYW1lIiwianRpIjoiM2Q1OWI3NWYtYTc2Mi00YmFhLTkxMTYtMTljODJmZGY4ZGUzIiwiaWF0IjoxNjM2NTYyMDYwLCJleHAiOjM4NDU1NDg4ODEsImNsaWVudF9pZCI6ImZiZjczOWM0LWZiODYtNGYwMy1hNDc3LTkxYWY1MWNjNDZmMiIsInJvbGVzIjpbInZlbmRvciJdLCJlbnRpdGxlbWVudHMiOlt7ImVkdWNhdGlvbk9yZ2FuaXphdGlvbnMiOlsxMjNdLCJncmFkZUxldmVscyI6WzksMTBdfV19.wVlfY7CogtyAM0PaOnwVst1ut-VPwBYRU2FOe9poJngf8RFDwFRprRclaB5PNN_vpgv7jaP-4weJSHF3UKObvqNg9Dl42qxTUlFlJitSIuwn9cvV0JcInbFl10aIoLMH3daYydExRX_1gowj-b7J_uN5wWhHLZphwVhdYXn1PjQW-zCyb27hqhtwbsoQsoDqJMv27nUfMPtehZQCBa776i7YgnqtNwsjcXB9jDlICdJFvNT-reTGHSx32rKR7DrDN2AsVdFp8F-qMjOUBVok1fOIeDJ8lt9IBk1nh-Z1RSVmqgTf95eXhdTMx-bhs2atPHce19soidGAhfNWrhuJ4A",
  "token_type":"Bearer",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA"
}
```

When decoded, that `access_token` contains the same response as in option 1.

```json
{
  "iss": "ed-fi-meadowlark",
  "aud": "ed-fi-meadowlark",
  "sub": "client name",
  "jti": "3d59b75f-a762-4baa-9116-19c82fdf8de3",
  "iat": 1636562060,
  "exp": 3845548881,
  "client_id": "fbf739c4-fb86-4f03-a477-91af51cc46f2",
  "roles": [ "vendor" ],
  "entitlements": [ { "educationOrganizations": [ 123 ], "gradeLevels": [9, 10] } ]
}
```

In this format, bot the Meadowlark DMS and the client have additional
information at their disposal, without having to use token introspection with
the OAuth provider. So long as the JWT is using one of the RS* algorithms (e.g,
RS256), the DMS can check the JWT's signature using a public key, thus
confirming that the JWT has not been modified. But, this does not satisfy the
requirement to confirm that the token has not been revoked. For that, the DMS
still needs to contact the OAuth introspection service. Thus, JWT presents two
variations for option 2: verification only (using signature), or
verification+introspection (to track revoked token).

Additional requirements if using JWT:

7. JWT's will be signed using the RS256 algorithm.

### Analysis

The JWT format does not offer much advantage in a pure system-to-system
topology, whereas it does offer some advantages for a front-end application: for
example, it can contain a person's name as the `sub` (subject), and the `roles`
may be used to adjust the user experience.

Option 1 thus presents a smaller access token and lighter network traffic. The
only advantage of the JWT is the self-verification. If we do not care about
tracking revoked tokens, then the JWT approach has a slight advantage in that it
does not require an additional call to the OAuth server.

Community input is needed before a decision can be made, as well as additional
investigation on current best practices, industry recommendations, and the
functionality available in likely OAuth Providers (AWS Cognito, Microsoft Entra,
Google Identity Platform, etc.).

## Authorization

### Claimsets

8. The Meadowlark DMS will have a hard-coded "host" claimset that can perform
   any action in all API's exposed by the application. ("no further
   authorization required").
9. The Meadowlark DMS will analyze additional Claimset(s) whose definitions are
   managed in an instance of the Ed-Fi Admin API (specification version TBD).
   This system will map a single Claimset name to the resources that the client
   can access and the actions (create, read, update, delete) that can be
   performed on those actions. The DMS will grant or deny access at the endpoint
   level based on the claimset definition.

For example, the "SIS Vendor" claimset may be applied to a client credential.
The Meadowlark DMS would look up the _definition_ of that claimset via the Ed-Fi
Admin API. While the shape of the data may be very different than this,
essentially the Admin API service will provide a list like this abbreviated
list:

| API            | Endpoints                               | Create | Read | Update | Delete |
| -------------- | --------------------------------------- | ------ | ---- | ------ | ------ |
| Descriptors    | `*`                                     | no     | yes  | no     | no     |
| Resources      | LocalEducationAgencies                  | no     | yes  | no     | no     |
| Resources      | Students                                | yes    | yes  | yes    | yes    |
| Resources      | StudentEducationOrganizationAssociation | yes    | yes  | yes    | yes    |
| Change Queries | `*`                                     | no     | yes  | no     | no     |

`*` implies access to all enbdpoints. This is for illustrative purposes only,
and will require further design and review.

### Entitlements

> ![WARNING] also need namespace and ownership defined somewhere.

10. For claimsets other than "host", the Meadowlark DMS will further restrict
    access for create, read, update, and delete operations on an endpoint by an
    allowed list of Education Organizations.
    1. The Education Organization entitlements will be managed through an
       EducationOrganizationId, and are restricted to education organizations
       that _are_ Local Education Agencies, Schools, or Educator Preparation
       Programs.
       * ❗ Is this overly restrictive? How do we handle charter networks? Review
         Admin App, but that might be insufficient.
    2. When an Education Organization is a Local Education Agency, then the DMS
       will grant access to data belonging to Schools that belong to that Local
       Education Agency.
11. For claimsets other than "host", the Meadowlark DMS will further restrict
    data access by Grade Level _if_ a client is configured with a grade level
    entitltment.
    1. Thus, while at least one Education Organization is required for
       non-Hosts, Grade Levels are purely optional.
    2. If Grade Level _is not_ provided, then the client will have access to all
       grade levels.
    3. If Grade Level _is_ provided, then the client will only be able to access
       student data for students currently enrolled in that grade level.

## Admin API

... using the Admin API 2 definition, or iterate on it for a version 3 (there
are still problematic aspects to it).

## Future Considerations

* Should we require [Mutual TLS Client Authentication and Certificate-Bound
Access Tokens](https://oauth.net/2/mtls/)?
* Should we allow a client to have multiple Claimsets / roles?
* Should we support the notion of Scopes in some way?

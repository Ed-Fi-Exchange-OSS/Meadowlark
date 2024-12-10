# Meadowlark - Internal OAuth 2 Client Credential Provider

## Overview

The Ed-Fi API needs to be secured with the OAuth 2.0 Client Credentials flow. In many cases a third-party authentication provider will be most appropriate for managing authentication. However, some organizations may wish to continue using a built-in authentication provider, as with the ODS/API Suite 3. In addition to managing the authentication process itself, the built-in provider should handle provisioning of keys and secrets. In this way, we will be able to have a micro data store that is accessed by only a single application.

## Requirements

### Authentication / Token Generation

Support [Client Credentials flow](https://www.oauth.com/oauth2-servers/access-tokens/client-credentials/)

1. Example route signature: `POST /oauth/token`
2. with support for the following message body formats:
    1. `grant_type` , `client_id` , and `client_secret`  in a JSON payload
    2. `grant_type` , `client_id` , and `client_secret`  in a form-urlencoded payload
    3. `grant_type` in a json payload, with `client_id` , and `client_secret`  encoded into a basic authentication header
    4. `grant_type` in a form-urlencoded payload, with `client_id` , and `client_secret`  encoded into a basic authentication header.
3. with responses:
    1. 200 when the request is valid, with a signed JSON Web Token (JWT) as an access code response (more detail on JWT below). Example:

      ```json
      {
        "access_token": "eyJ0eXAiOiJKV1QiLCJibGciOiJIUzI1NiJ9.eyJpc3MiOiJlZC1maS1tZWfkb3dsYXJrIiwiYXVkIjoibWVhZG93bGFyayIsInJvbGVzIjpbInZlbmRvciJdLCJzdWIiOiJzdXBlci1ncmVhdC1TSVMiLCJqdGkiOiIyODQxNTY3Yi0wNzRiLTRiMDktYmQwMS1jZGYyODVlY2NjMDEiLCJpYXQiOjE2NTkzNzA2MjgsImV4cCI6MTY1OTM3NDIyOH0.GKwl3Uactabl6emQy9Ta2R5emGL6IF_v8w85LoR2wAs",
        "token_type": "bearer",
        "expires_in": 1659374228,
        "refresh_token": "not available"
      }
        ```

    2. 400 when the payload *structure* is invalid or the `grant_type`  is invalid. Example:

      ```json
      {
        "message": "The request is invalid.",
        "modelState": {
          "grant_type": [
            "The grant_type '???' is not supported."
          ]
        }
      }
      ```

      > [!WARNING]
      > This is an "ideal" example that provides some consistency with existing messaging. The actual solution can be different based on the package components used in the solution.

    3. 401 with no message body when the `client_id`  or `client_secret`  is invalid. ![(warning)](https://edfi.atlassian.net/wiki/s/695013191/6452/be943731e17d7f4a2b01aa3e67b9f29c0529a211/_/images/icons/emoticons/warning.png)

         Deliberately not revealing *why* the authentication attempt failed.

#### JSON Web Token Response

The access token provided by the /oauth/token endpoint should be in the format of a [signed JSON Web Token](https://jwt.io/introduction/) (JWT). The expected format of the JWT is described in some detail in [Meadowlark - Data Authorization](../../meadowlark-security/meadowlark-data-authorization.md). In summary, the token's payload is expected to match this structure:

```json
{
  "iss": "ed-fi-meadowlark",
  "aud": "ed-fi-meadowlark",
  "sub": "client name",
  "jti": "3d59b75f-a762-4baa-9116-19c82fdf8de3",
  "iat": 1636562060,
  "exp": 3845548881,
  "client_id": "fbf739c4-fb86-4f03-a477-91af51cc46f2",
  "roles": [ "vendor" ]
}
```

### Token Introspection

An endpoint for [verifying a token](https://datatracker.ietf.org/doc/html/rfc7662) and accessing information about the token.

1. Example route signature: POST /oauth/verify with the token to verify in a form-urlencoded body, as well as a valid token authorizing the request itself. Example:

    ```none
    POST /oauth/verify
    Authorization: bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI....
    Content-Type: application/x-www-form-urlencoded

    token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI....
    ```

    1. ⚠️ The specification notes an optional `token_type`  hint. Meadowlark will only support bearer tokens, so this parameter is not necessary. However, the service should not reject a payload that includes this parameter. It can simply ignore the parameter, always validating as a bearer token.
2. responses:
    1. 200 if the token is still valid with a message body containing the token information in in a JSON payload.

        1. Active token example:

            **Active Token**

            ```json
            {
              "active": true,
              "client_id": "fbf739c4-fb86-4f03-a477-91af51cc46f2",
              "sub": "client name",
              "aud": "ed-fi-meadowlark",
              "iss": "ed-fi-meadowlark",
              "exp": 1659374285,
              "iat": 1659374285,
              "roles": [
                "vendor"
              ]
            }
            ```

        2. Inactive token example:

            **Inactive Token**

            ```json
            {
              "active": false
            }
            ```

        3. `active`  will mean that the token is valid:
            1. issued by this application
            2. not revoked
            3. not expired
            4. client has not been deactivated
    2. 401 if the Authorization header is missing or "corrupt".
3. Authorization
    1. A token with the "vendor" or "host" role can only verify their own token, no others. A token with the "admin" role can verify any token.
    2. A token with "admin.

> [!TIP]
> One implication of this design is that the meadowlark API application needs to have client credentials with the "admin" role in order to verify incoming tokens.

## Client Credential Management

At this time there is no concept of vendors and applications - just keys and secrets. Therefore most of the Admin API Design is not relevant to this project. We simply need to have a route that supports creating keys and secrets.

* Support standard HTTP verbs and status codes
* Requires a token with role claim of "admin", any other valid token gets a 403 "forbidden" response, and invalid or no token gets a 401 response.
* URL endpoint: "oauth/client" to start with, adjust as needed.
* GET
  * GET by id
  * GET all
* POST
  * body

    ```json
    {
      "clientName": "Hometown SIS",
      "roles": [
        "vendor"
      ]
    }
    ```

  * 400 response if clientName is missing and/or there is not at least one role in the request.
  * Three roles and one variant will be available.
    * vendor
      * READ access on all descriptors
      * Full CRUD access on those resources created by this client credential
      * OAuth Token introspection for own token
    * host
      * Full CRUD access on all Ed-Fi API resources
      * OAuth Token introspection for own token
    * admin
      * Full CRUD on OAuth Client endpoint
      * OAuth Token introspection for any token
    * assessment
      * Disables the reference checks on POST statements
    * Generally speaking, one client would have *either* vendor *or* host role, not both. However, it is probably not worthwhile to force them to be mutually exclusive through validation.
  * response

    ```none
    location: /oauth/client/a-uuid-v4-value

    {
      "active": true
      "client_id": "a-uuid-v4-value",
      "client_secret": "a really good random secret",
      "clientName": "Hometown SIS",
      "roles": [
        "vendor"
      ]
    }
    ```

    * Note the presence of `active`  in the output response. That will be an optional value that defaults to `true`  on POST.
* PUT
  * body

    ```json
    {
      "active": false,
      "client_id": "a-uuid-v4-value",
      "clientName": "Hometown SIS",
      "roles": [
        "vendor"
      ]
    }
    ```

  * does not update client\_id or client\_secret
* Generate a new secret for an existing client id:
  * Request: `POST /oauth/client/a-uuid-v4-value/reset`
  * Response

    ```json
    {
      "client_id": "a-uuid-v4-value",
      "client_secret": "a new really good random secret"
    }
    ```

## Implementation Notes

### Microservice

> [!TIP]
> As of Meadowlark 0.3.0, the code is easily separable, but for ease of use it is still integrated into the same Fastify application.

Application could be separate from the Meadowlark Ed-Fi API, and can be written in either TypeScript or Python.

As a microservice, it will have its own datastore.

* Should support both PostgreSQL and MongoDB
* By default, should use the same database as the Meadowlark API code, but with complete independence from the tables / collections used by the API code.

Can utilize open source\* third-party identity provide packages (so as not GPL, LGPL, Affero GPL, or other restrictive / "viral" license)

### Bootstrapping Initial Admin Credentials

If there are no admin accounts, relax security to allow new "admin" type client creation without a token. As soon as the first one is created, fully enforce the token authentication, and do not allow a new token to be created.

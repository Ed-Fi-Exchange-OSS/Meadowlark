# Meadowlark Authentication with OAuth2

Meadowlark contains a built-in [OAuth2 Provider](https://oauth.net/) that
supports that [client-credentials
grant](https://oauth.net/2/grant-types/client-credentials/). In the future,
Meadowlark will also support third-party providers. To that end, the Meadowlark
Ed-FI API application uses the Meadowlark OAuth2 endpoints as a client, rather
than accessing shared code. There are also client management endpoints for
creating, updating, and invalidating API clients.

- [Meadowlark Authentication with OAuth2](#meadowlark-authentication-with-oauth2)
  - [Expected JSON Web Token Format](#expected-json-web-token-format)
  - [Meadowlark as OAuth2 Server](#meadowlark-as-oauth2-server)
    - [Token Authentication](#token-authentication)
    - [Token Introspection](#token-introspection)
      - [Valid Token Response](#valid-token-response)
      - [Invalid Token Response](#invalid-token-response)
    - [Client Credential Management](#client-credential-management)
    - [Server Configuration](#server-configuration)
  - [Meadowlark as OAuth2 Client](#meadowlark-as-oauth2-client)
    - [Client Configuration](#client-configuration)

## Expected JSON Web Token Format

Meadowlark authentication and authorization relies on [JSON Web
Tokens](https://jwt.io/) (JWT). Both the OAuth2 provider and the API
application, as a client, need to have the same expectations for what makes up a
proper JWT. Meadowlark also uses the
[roles](https://www.rfc-editor.org/rfc/rfc9068.html#name-roles) optional claim
as an array of strings: vendor, assessment, host, admin.

Side note: Meadowlark does not use the concept of Scopes.

Example:

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

These tokens are signed to prevent tampering, using a 256-bit key.

## Meadowlark as OAuth2 Server

The OAuth2 Provider supports the following operations:

### Token Authentication

Request body should be a standard
[client_credentials](https://www.oauth.com/oauth2-servers/access-tokens/client-credentials/)
request. For example:

```none
POST http://localhost:3000/local/oauth/token
content-type: application/json

{
    "grant_type": "client_credentials",
    "client_id": "{client id}",
    "client_secret": "{client secret}"
}
```

Sample response to validated request:

```json
{
  "access_token": "{a properly-formatted JWT}",
  "token_type": "bearer",
  "expires_in": 1659374228,
  "refresh_token": "not available"
}
```

### Token Introspection

This verb and endpoint supports the concept of [token
introspection](https://datatracker.ietf.org/doc/html/rfc7662). The Meadowlark
API as a client calls this endpoint to validate the received token.

Sample request:

```none
POST /oauth/verify
Authorization: bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI....

token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI....
```

Note that only form-urlencoded requests are accepted, per the specification.

Only an authenticated client can post to the `/oauth/verify` endpoint. A client
with the "admin" role can post _any_ token, whereas other clients can only post
their _own_ token for introspection.

#### Valid Token Response

Contains the "plain text" of the JWT, with the additional `active` attribute
showing that the token is not expired and has not otherwise been invalidated.

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

#### Invalid Token Response

If the token is expired, or has been invalidated (for example, the client's
access has been revoked), then the response will look like:

```json
{
  "active": false
}
```

### Client Credential Management

Only clients with the "admin" role may access these endpoints.

- `GET /oauth/client`
- `GET /oauth/client/{client id}`
- `POST /oauth/client`

  ```json
  {
    "clientName": "Hometown SIS",
    "roles": [
      "vendor"
    ]
  }
  ```

- `PUT /oauth/client/{client id}`

  ```json
  {
    "client_id": "{client id}",
    "clientName": "Hometown SIS",
    "roles": [
      "vendor"
    ]
  }
  ```

- `DELETE /oauth/client/{client id}` - deactivates, does not remove the client
- `POST /oauth/client/{client id}/reset` - generates a new `client_secret` for
  the key

### Server Configuration

These environment variables control the internal OAuth2 provider:

| Variable                 | Default Value    | Purpose                                                |
| ------------------------ | ---------------- | ------------------------------------------------------ |
| OAUTH_EXPIRATION_MINUTES | 60               | Length of time for a token to remain valid, in minutes |
| OAUTH_TOKEN_ISSUER       | ed-fi-meadowlark | Value for the `iss` (issuer) claim on the token        |
| OAUTH_TOKEN_AUDIENCE     | ed-fi-meadowlark | Value for the `aud` (audience) claim on the token      |
| OAUTH_SIGNING_KEY        | {empty}          | Base64-encoded 256 bit signing key                     |

There are multiple options for generating a signing key.

1. If you have `openssl`, run: `openssl rand -base64 256`.
2. Run the Meadowlark service and issue a GET request to endpoint
   `/{stage}/oauth/createSigningKey`

## Meadowlark as OAuth2 Client

As described above, Meadowlark's Ed-Fi API treats the OAuth2 provider as a
service, rather than using shared code. Done right, this should make it trivial
to integrate with third party providers.

One implication: the API application should not need to know the signing key;
only the OAuth2 provider will have that. Thus the client application must use
the token introspection endpoint to validate a received token. Validated tokens
are cached so that subsequent requests do not need to revalidate them, except
for confirming the expiration date. Tokens remain in the cache by default for up
to 5 minutes; if there are 1000 (configurable) tokens then the oldest ones are
vacated more quickly to make room for more tokens.

### Client Configuration

These environment variables are on the Meadowlark client side; when we get to
the point of having third party OAuth providers, these settings will still be
relevant, whereas the settings above will not be needed.

| Variable                                      | Default Value     | Purpose                                               |
| --------------------------------------------- | ----------------- | ----------------------------------------------------- |
| OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL         | 300000 ms (5 min) | Length of time to accept a token without revalidating |
| OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES | 1000              | Max number of validated tokens to cache               |

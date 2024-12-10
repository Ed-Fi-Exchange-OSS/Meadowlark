# Meadowlark 0.2.0 - Security

# Authentication

Meadowlark 0.2.0 will not (yet) integrate real authentication: it will continue to have the hard-coded authentication token mechanism provided in [Meadowlark 0.1.0 - Security](../../meadowlark-releases/meadowlark-010/meadowlark-010-security.md).

# Authorization

On the authorization side, milestone 0.2.0 will:

*   remove some original prototypical education organization-based authorization, 
*   continue to support ownership-based authorization, and
*   introduce a full-access claim and a third hard-coded JSON Web Token (JWT).

The full-access claim would be used by the API provider for full API synchronization. It will also be establish an initial pattern for other authorization schemes in the future, based on claims encoded in the JWT.

## Current Token

A signed JSON web token contains three different components. For detailed information, see for example [auth0: JSON Web Token Structure](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-structure). The long second portion, for one of the hard-coded Meadowlark tokens, decodes to this:

```
{
  "iss": "ed-fi-meadowlark",
  "aud": "meadowlark",
  "sub": "super-great-SIS",
  "jti": "3d59b75f-a762-4baa-9116-19c82fdf8de3",
  "iat": 1636562060,
  "exp": 3845548881
}
```

These are all standard "reserved" claims defined in the JWT specification.

*   iss = issuer
*   aud = audience
*   sub = subject (in this case, a vendor name)
*   jti = unique identifier
*   iat = issued at (datetime in Unix epoch format)
*   exp = expires at (again in epoch format)

## Future Token

The token will include additional claims:

*   client\_id - the client\_id used to authenticate
*   roles - with two values at this time: vendor and host. 

The "host" role will grant full access to all resources.

This design is subject to revision in a future milestone, once we get further into the work of integrating with OAuth2 providers.

# Infrastructure

No changes compared to [Meadowlark 0.1.0 - Security](../../meadowlark-releases/meadowlark-010/meadowlark-010-security.md) - still not trying to create production-ready product.

> [!WARNING]
> This document is for discussion and general guidance. The implementation may vary as needed. The development team will endeavor to keep this document up-to-date, though working software remains a higher priority than comprehensive documentation.

**Table of Contents**

*   [Authentication](#authentication)
*   [Authorization](#authorization)
    *   [Current Token](#current-token)
    *   [Future Token](#future-token)
*   [Infrastructure](#infrastructure)
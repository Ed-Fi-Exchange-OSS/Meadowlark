# Meadowlark - Metadata Endpoint Gaps

## Overview

The ODS/API metadata endpoints that Meadowlark supports are as follows:

* ODS/API [version](https://api.ed-fi.org/v5.3/api/)
* OpenAPI [endpoint list](https://api.ed-fi.org/v5.3/api/metadata/)
* OpenAPI for [resources](https://api.ed-fi.org/v5.3/api/metadata/data/v3/resources/swagger.json)
* OpenAPI for [descriptors](https://api.ed-fi.org/v5.3/api/metadata/data/v3/descriptors/swagger.json)
* ODS/API [dependency ordering](https://api.ed-fi.org/v5.3/api/metadata/data/v3/dependencies)

As of Meadowlark 0.2.0, these endpoints are largely hardcoded to appear as ODS/API v5.3 with Data Standard 3.3.1-b, and need to be changed over to being self-generated.

## ODS/API Version Endpoint

The "version endpoint" is not defined as a formal standard, though this analysis has prompted a request to standardize the API.

Example from the .NET Ed-Fi ODS/API, version 5.3:

```kjson
{
  "version": "5.3",
  "informationalVersion": "5.3",
  "suite": "3",
  "build": "5.3.1434.0",
  "apiMode": "Sandbox",
  "dataModels": [
    {
      "name": "Ed-Fi",
      "version": "3.3.1-b",
      "informationalVersion": "Latest Ed-Fi Data Model v3.3b"
    },
    {
      "name": "TPDM",
      "version": "1.1.0",
      "informationalVersion": "TPDM-Core"
    }
  ],
  "urls": {
    "dependencies": "https://api.ed-fi.org/v5.3/api/metadata/data/v3/dependencies",
    "openApiMetadata": "https://api.ed-fi.org/v5.3/api/metadata/",
    "oauth": "https://api.ed-fi.org/v5.3/api/oauth/token",
    "dataManagementApi": "https://api.ed-fi.org/v5.3/api/data/v3/",
    "xsdMetadata": "https://api.ed-fi.org/v5.3/api/metadata/xsd"
  }
}
```

### Option 1: Completely Match the .NET ODS/API

The version endpoint describes the ODS/API version, API mode (e.g. "Sandbox"), data models available (e.g. Data Standard 3.3.1-b) and a list of URLs to the other parts of the API. ODS/API version and data models available are the only parts that need to be made dynamic. Meadowlark has the data models available. ODS/API version map to Ed-Fi data model versions, so we will need either a hardcoded mapping or an environment variable on what ODS/API version to report as. An environment variable solution would avoid releasing hardcoding updates at each new ODS/API release, but would require additional knowledge on the part of the deployment team, such as which ODS/API versions are required for a particular data standard version.

### Option 2: Redefine the Standard

1. Required Elements
    1. **version**: software version number
    2. **dataModels**: list of the supported data models, each taking the form
        1. **name**: Ed-Fi or extension project name
        2. **version:** the data model version number
        3. **informationalVersion:** text description of the version
    3. **urls**:
        1. **dependencies**: a document that lists the dependency order of resources, e.g. so that a client application or human reader will be able to answer questions like "what resources must I load before I can load a StudentEducationOrganizationAssociation?"
        2. **openApiMetadata:** a URL to a JSON document that contains links to Open API specification documents
        3. **oauth:** The OAuth 2 token endpoint for authentication
        4. **dataManagementApi**: base endpoint for all Ed-Fi API routes
        5. **xsdMetadata**: a document containing links to XSD files

            > [!WARNING]
            > Consider omitting XSD from the standard, although it is very useful for file uploads using the API Client Bulk Loader.
            > Implication: there is only a single URL for the resources, meaning that we cannot be actively running two different data standards in the same deployment.

2. Customized-elements
    1. For convenience, a Version endpoint may contain other fields that are not listed above, but they should not be interpreted as part of the standard API shape.

Example:

```json
{
  "version": "0.2.0",
  "dataModels": [
    {
      "name": "Ed-Fi",
      "version": "3.3.1-b",
      "informationalVersion": "Latest Ed-Fi Data Model v3.3b"
    }
  ],
  "urls": {
    "dependencies": "https://example.com/stg/metadata/dependencies",
    "openApiMetadata": "https://example.com/stg/metadata/",
    "oauth": "https://example.com/stg/oauth/token",
    "dataManagementApi": "https://example.com/stg/api/v3.3-1b/",
    "xsdMetadata": "https://example.com/stg/metadata/xsd"
  }
}
```

## OpenAPI Endpoint List

This is a simple listing of the resource and descriptors OpenAPI endpoints, and does not require updating.

## OpenAPI for Resources and Descriptors

This is the OpenAPI specification of the ODS/API resource and descriptors endpoints, which are very large JSON documents entirely dependent on the data models in use. As of Meadowlark 0.2.0, they are just a copy of the ODS/API v5.3 endpoint JSON. It will be a fair amount of work to generate OpenAPI dynamically, as described below.

### JSON Schema → OpenAPI

Development versions of Meadowlark 0.3.0 currently generate JSON Schema version 2020-12 descriptions of resource documents. OpenAPI has always used a resource document description based on some version JSON Schema, but sometimes with differences. However, the most recent version of OpenAPI (v3.1 released Feb 2021) has adopted JSON Schema 2020-12 for describing resource documents, which solves an important piece of OpenAPI generation. (References: [What's New in OpenAPI 3.1](https://nordicapis.com/whats-new-in-openapi-3-1-0/), [Validating OpenAPI and JSON Schema](https://json-schema.org/blog/posts/validating-openapi-and-json-schema))

A missing piece of current JSON Schema generation versus the ODS/API's OpenAPI spec is that Meadowlark's JSON Schema generation does not reuse pieces of schema via "$ref" references. For example, in the ODS/API OpenAPI spec, references in a document like "schoolReference" are a $ref to an "edFi\_schoolReference" JSON schema object, while Meadowlark generates the full schoolReference definition everywhere it is used. This is fine for internal Meadowlark use but would bloat a stringified version of the schema in OpenAPI form.

### OpenAPI Documentation

The ODS/API provides interactive API documentation via embedded Swagger UI. However Swagger UI from SmartBear does not yet support OpenAPI 3.1, so a different API documentation provider will need to be used. Documentation providers (including the new Swagger UI in development) seem to be converging on a different look-and-feel from the original SwaggerUI. A popular one that is CDN hosted and thus trivial to use is [Stoplight Elements](https://github.com/stoplightio/elements).

### x-Ed-Fi-isIdentity

The ODS/API OpenAPI spec includes "x-Ed-Fi-isIdentity" as an OpenAPI extension to tag fields that are part of the document identity. This is not part of the generated JSON Schema and would need to be mixed in somehow to preserve that tagging behavior.

### Validation of Correctness

Once Meadowlark is generating OpenAPI we'll want to validate it for correctness in tests, much like we do with generated JSON Schema by running it through ajv. A good choice would be to use [Spectral](https://meta.stoplight.io/docs/spectral/674b27b261c3c-overview), which is a JSON linter with an OpenAPI ruleset.

## ODS/API dependency ordering

The ODS/API dependency ordering endpoint provides a list of all resources and descriptors in dependency order, meaning the load order required to avoid referential integrity issues. The ordering derives from both the model itself and any additional constraints from the mode of security used. Security won't be an issue for Meadowlark for the time being.

The ODS/API provides the dependencies in groupings where any resource in the group can be loaded without issue, as opposed to an absolute ordering for each resource. This allows loaders to work in parallel for resources in the same group. It would be nice for Meadowlark to provide the same behavior, though not mandatory.

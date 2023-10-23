// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DomainEntityBuilder,
  MetaEdEnvironment,
  MetaEdTextBuilder,
  NamespaceBuilder,
  newMetaEdEnvironment,
} from '@edfi/metaed-core';
import { validateEndpoint } from '../../src/validation/EndpointValidator';
import { NoResourceInfo } from '../../src/model/ResourceInfo';
import { ApiSchema } from '../../src/model/api-schema/ApiSchema';
import { apiSchemaFrom } from '../TestHelper';
import { EndpointValidationResult } from '../../src/validation/EndpointValidationResult';
import { TraceId } from '../../src/model/IdTypes';
import { ProjectShortVersion } from '../../src/model/ProjectShortVersion';
import { ProjectNamespace } from '../../src/model/api-schema/ProjectNamespace';
import { EndpointName } from '../../src/model/api-schema/EndpointName';
import { NoResourceSchema } from '../../src/model/api-schema/ResourceSchema';

describe('given an invalid endpoint name with a suggested matching name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: EndpointValidationResult;

  beforeAll(async () => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')

      .withStartDomainEntity('School')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);

    result = await validateEndpoint(
      apiSchema,
      {
        projectShortVersion: 'a' as ProjectShortVersion,
        projectNamespace: 'edfi' as ProjectNamespace,
        endpointName: 'schoo' as EndpointName,
      },
      '' as TraceId,
    );
  });

  it('returns an error message', () => {
    expect(result.errorBody).toMatchInlineSnapshot(`
      {
        "error": "Invalid resource 'schoo'. The most similar resource is 'schools'.",
      }
    `);
  });

  it('returns no resource info', () => {
    expect(result.resourceInfo).toBe(NoResourceInfo);
  });

  it('returns no resource schema', () => {
    expect(result.resourceSchema).toBe(NoResourceSchema);
  });
});

describe('given an invalid endpoint name with no suggested matching name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: EndpointValidationResult;

  beforeAll(async () => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')

      .withStartDomainEntity('School')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);

    result = await validateEndpoint(
      apiSchema,
      {
        projectShortVersion: 'a' as ProjectShortVersion,
        projectNamespace: 'edfi' as ProjectNamespace,
        endpointName: 'nomatch' as EndpointName,
      },
      '' as TraceId,
    );
  });

  it('returns an error message', () => {
    expect(result.errorBody).toMatchInlineSnapshot(`
      {
        "error": "Invalid resource 'nomatch'.",
      }
    `);
  });

  it('returns no resource info', () => {
    expect(result.resourceInfo).toBe(NoResourceInfo);
  });

  it('returns no resource schema', () => {
    expect(result.resourceSchema).toBe(NoResourceSchema);
  });
});

describe('given a valid endpoint name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: EndpointValidationResult;

  beforeAll(async () => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')

      .withStartDomainEntity('School')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);

    result = await validateEndpoint(
      apiSchema,
      {
        projectShortVersion: 'a' as ProjectShortVersion,
        projectNamespace: 'edfi' as ProjectNamespace,
        endpointName: 'schools' as EndpointName,
      },
      '' as TraceId,
    );
  });

  it('returns no error message', () => {
    expect(result.errorBody).toBeUndefined();
  });

  it('returns resource info', () => {
    expect(result.resourceInfo).toMatchInlineSnapshot(`
      {
        "allowIdentityUpdates": false,
        "isDescriptor": false,
        "projectName": "EdFi",
        "resourceName": "School",
        "resourceVersion": "",
      }
    `);
  });

  it('returns resource schema', () => {
    expect(result.resourceSchema).toMatchInlineSnapshot(`
      {
        "allowIdentityUpdates": false,
        "documentPathsMapping": {
          "SchoolId": {
            "isReference": false,
            "pathOrder": [
              "schoolId",
            ],
            "paths": {
              "schoolId": "$.schoolId",
            },
          },
        },
        "equalityConstraints": [],
        "identityFullnames": [
          "SchoolId",
        ],
        "identityPathOrder": [
          "schoolId",
        ],
        "isDescriptor": false,
        "isSchoolYearEnumeration": false,
        "isSubclass": false,
        "jsonSchemaForInsert": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "description": "doc",
          "properties": {
            "_ext": {
              "additionalProperties": true,
              "description": "optional extension collection",
              "properties": {},
              "type": "object",
            },
            "schoolId": {
              "description": "doc",
              "maxLength": 30,
              "type": "string",
            },
          },
          "required": [
            "schoolId",
          ],
          "title": "EdFi.School",
          "type": "object",
        },
        "jsonSchemaForQuery": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "description": "doc",
          "properties": {
            "_ext": {
              "additionalProperties": true,
              "description": "optional extension collection",
              "properties": {},
              "type": "object",
            },
            "schoolId": {
              "description": "doc",
              "maxLength": 30,
              "type": "string",
            },
          },
          "required": [],
          "title": "EdFi.School",
          "type": "object",
        },
        "jsonSchemaForUpdate": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "description": "doc",
          "properties": {
            "_ext": {
              "additionalProperties": true,
              "description": "optional extension collection",
              "properties": {},
              "type": "object",
            },
            "id": {
              "description": "The item id",
              "type": "string",
            },
            "schoolId": {
              "description": "doc",
              "maxLength": 30,
              "type": "string",
            },
          },
          "required": [
            "id",
            "schoolId",
          ],
          "title": "EdFi.School",
          "type": "object",
        },
        "resourceName": "School",
      }
    `);
  });
});

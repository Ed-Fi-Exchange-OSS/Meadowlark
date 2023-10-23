// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  MetaEdEnvironment,
  newMetaEdEnvironment,
  MetaEdTextBuilder,
  NamespaceBuilder,
  DomainEntityBuilder,
  AssociationBuilder,
} from '@edfi/metaed-core';
import { domainEntityReferenceEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import * as EndpointValidator from '../../src/validation/EndpointValidator';
import { endpointValidation } from '../../src/middleware/ValidateEndpointMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { newResourceInfo, NoResourceInfo } from '../../src/model/ResourceInfo';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { DocumentUuid } from '../../src/model/IdTypes';
import { EndpointValidationResult } from '../../src/validation/EndpointValidationResult';
import { NoResourceSchema } from '../../src/model/api-schema/ResourceSchema';
import { EndpointName } from '../../src/model/api-schema/EndpointName';
import { ProjectNamespace } from '../../src/model/api-schema/ProjectNamespace';
import { ProjectShortVersion } from '../../src/model/ProjectShortVersion';
import { ApiSchema } from '../../src/model/api-schema/ApiSchema';
import { apiSchemaFrom } from '../TestHelper';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockResourceValidator: any;

  beforeAll(async () => {
    mockResourceValidator = jest.spyOn(EndpointValidator, 'validateEndpoint');

    // Act
    resultChain = await endpointValidation({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls resourceValidation', () => {
    expect(mockResourceValidator).not.toHaveBeenCalled();
  });
});

describe('given an error response and no document info from resourceValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;
  const errorBody = 'An error occurred XYZ';
  let mockResourceValidator: any;

  beforeAll(async () => {
    const validationResult: EndpointValidationResult = {
      resourceInfo: NoResourceInfo,
      errorBody,
      resourceSchema: NoResourceSchema,
    };

    mockResourceValidator = jest
      .spyOn(EndpointValidator, 'validateEndpoint')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await endpointValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected error message', () => {
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`"An error occurred XYZ"`);
  });
});

describe('given an error response and document info from resourceValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const errorBody = 'An error occurred';
  let resultChain: MiddlewareModel;
  let mockResourceValidator: any;

  beforeAll(async () => {
    const validationResult: EndpointValidationResult = {
      resourceInfo: newResourceInfo(),
      errorBody,
      resourceSchema: NoResourceSchema,
    };

    mockResourceValidator = jest
      .spyOn(EndpointValidator, 'validateEndpoint')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await endpointValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 400', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(400);
  });

  it('returns the expected error message', () => {
    expect(resultChain.frontendResponse?.body).toEqual(errorBody);
  });
});

describe('given a valid response from resourceValidation', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const resourceInfo = newResourceInfo();
  const headerMetadata = {};
  let resultChain: MiddlewareModel;
  let mockResourceValidator: any;

  beforeAll(async () => {
    const validationResult: EndpointValidationResult = {
      resourceInfo,
      resourceSchema: NoResourceSchema,
      headerMetadata,
    };

    mockResourceValidator = jest
      .spyOn(EndpointValidator, 'validateEndpoint')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await endpointValidation({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockResourceValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds resourceInfo to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.resourceInfo).toBe(resourceInfo);
  });

  it('adds headerMetadata to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.headerMetadata).toEqual(headerMetadata);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

describe('given requesting abstract domain entity', () => {
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    const metaEd: MetaEdEnvironment = newMetaEdEnvironment();

    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')

      .withStartAbstractEntity('EducationOrganization')
      .withDocumentation('doc')
      .withStringIdentity('EducationOrganizationId', 'doc', '30')
      .withEndAbstractEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);

    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      body: '{"documentUuid": "db4f71a9-30dd-407a-ace4-07a056f781a3", "body": "a body"}',
      headers: { 'reference-validation': 'false' },
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: {
          endpointName: 'educationOrganizations' as EndpointName,
          projectNamespace: 'edfi' as ProjectNamespace,
          projectShortVersion: 'v3.3b' as ProjectShortVersion,
          documentUuid: 'db4f71a9-30dd-407a-ace4-07a056f781a3' as DocumentUuid,
        },
        apiSchema,
      },
    };

    // Act
    resultChain = await endpointValidation({ frontendRequest, frontendResponse: null });
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid resource 'educationOrganizations'.",
      }
    `);
  });
});

describe('given requesting abstract association', () => {
  let resultChain: MiddlewareModel;

  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();

  beforeAll(async () => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')

      .withStartAssociation('GeneralStudentProgramAssociation')
      .withDocumentation('doc')
      .withAssociationDomainEntityProperty('Student', 'doc')
      .withAssociationDomainEntityProperty('Program', 'doc')
      .withEndAssociation()

      .withStartDomainEntity('Student')
      .withDocumentation('doc')
      .withStringIdentity('StudentId', 'doc', '30')
      .withEndDomainEntity()

      .withStartDomainEntity('Program')
      .withDocumentation('doc')
      .withStringIdentity('ProgramId', 'doc', '30')
      .withEndDomainEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new AssociationBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);

    const frontendRequest: FrontendRequest = {
      ...newFrontendRequest(),
      body: '{"documentUuid": "df4f71a9-30dd-407a-ace4-07a056f781a3", "body": "a body"}',
      headers: { 'reference-validation': 'false' },
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: {
          endpointName: 'generalStudentProgramAssociations' as EndpointName,
          projectNamespace: 'edfi' as ProjectNamespace,
          projectShortVersion: 'v3.3b' as ProjectShortVersion,
          documentUuid: 'df4f71a9-30dd-407a-ace4-07a056f781a3' as DocumentUuid,
        },
        apiSchema,
      },
    };

    // Act
    resultChain = await endpointValidation({ frontendRequest, frontendResponse: null });
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid resource 'generalStudentProgramAssociations'.",
      }
    `);
  });
});

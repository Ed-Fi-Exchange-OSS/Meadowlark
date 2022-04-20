// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import * as Get from '../../../src/handler/GetResolvers';
import { update } from '../../../src/handler/CrudHandler';
import * as RequestValidator from '../../../src/handler/RequestValidator';
import { PutResult } from '../../../src/plugin/backend/PutResult';
import { backendPlugin } from '../../../src/plugin/PluginLoader';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

describe('given there is no request body', () => {
  let response: APIGatewayProxyResult;
  const path = '/v3.3b/ed-fi/academicWeeks/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      body: null,
      headers: {},
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path,
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    response = await update(event, context);
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns an error message', () => {
    expect(response.body).toEqual(JSON.stringify({ message: 'Missing body' }));
  });
});

describe('given there is a malformed request body', () => {
  let response: APIGatewayProxyResult;
  const path = '/v3.3b/ed-fi/academicWeeks/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      body: 'this is not a JSON object',
      headers: {},
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path,
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    response = await update(event, context);
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns an error message', () => {
    expect(response.body).toEqual(JSON.stringify({ message: 'Malformed body' }));
  });
});

describe('given a completely missing resource path', () => {
  let response: APIGatewayProxyResult;
  let mockRequestValidator: any;
  const path = '/whatever';

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      body: '{"id": "string", "weekIdentifier": "string"}',
      headers: {},
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path,
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Setup the request validation to succeed
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        entityInfo: {
          foreignKeys: ['NK#schoolId=1'],
          naturalKey: 'NK#123',
        },
        errorBody: null,
        metaEdProjectHeaders: {},
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Act
    response = await update(event, context);
  });

  afterAll(() => mockRequestValidator.mockRestore());

  it('returns status 404', () => {
    expect(response.statusCode).toEqual(404);
  });

  it('returns no error message', () => {
    expect(response.body).toEqual('');
  });
});

describe('given a valid object', () => {
  let response: APIGatewayProxyResult;
  let mockRequestValidator: any;

  describe('given the object does not exist', () => {
    let mockDynamo: any;
    const metaEdHeaders = { header: 'one' };
    const path = '/v3.3b/ed-fi/academicWeeks/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';

    beforeAll(async () => {
      const event: APIGatewayProxyEvent = {
        body: '{"id": "string", "weekIdentifier": "string"}',
        headers: { 'reference-validation': false },
        path,
        requestContext: { requestId: 'ApiGatewayRequestId' },
      } as any;
      const context = { awsRequestId: 'LambdaRequestId' } as Context;

      // Setup the request validation to succeed
      mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
        Promise.resolve({
          entityInfo: {
            foreignKeys: ['NK#schoolId=1'],
            naturalKey: 'NK#123',
          },
          errorBody: null,
          metaEdProjectHeaders: metaEdHeaders,
        } as unknown as RequestValidator.ResourceValidationResult),
      );

      // Setup the update operation to fail
      mockDynamo = jest.spyOn(backendPlugin(), 'updateEntityById').mockReturnValue(
        Promise.resolve({
          result: 'UPDATE_FAILURE_NOT_EXISTS',
          failureMessage: 'Does not exist',
        }),
      );

      // Act
      response = await update(event, context);
    });

    afterAll(() => {
      mockRequestValidator.mockRestore();
      mockDynamo.mockRestore();
    });

    it('returns status 404', () => {
      expect(response.statusCode).toEqual(404);
    });

    it('returns no error message', () => {
      expect(response.body).toEqual('');
    });

    it('it returns headers', () => {
      expect(response.headers).toEqual(metaEdHeaders);
    });
  });
  describe('given the object does exist', () => {
    describe('given persistence is going to throw an error', () => {
      let mockDynamo: any;
      const expectedError = 'Dynamo did not like me';
      const expectedHeaders = { header: 'one' };
      const path = '/v3.3b/ed-fi/academicWeeks/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';

      beforeAll(async () => {
        const event: APIGatewayProxyEvent = {
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': false },
          path,
          requestContext: { requestId: 'ApiGatewayRequestId' },
        } as any;
        const context = { awsRequestId: 'LambdaRequestId' } as Context;

        // Setup the request validation to succeed
        mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
          Promise.resolve({
            entityInfo: {
              foreignKeys: ['NK#schoolId=1'],
              naturalKey: 'NK#123',
            },
            errorBody: null,
            metaEdProjectHeaders: expectedHeaders,
          } as unknown as RequestValidator.ResourceValidationResult),
        );

        // Setup the update operation to fail
        mockDynamo = jest.spyOn(backendPlugin(), 'updateEntityById').mockReturnValue(
          Promise.resolve({
            result: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: expectedError,
          }),
        );

        // Act
        response = await update(event, context);
      });

      afterAll(() => {
        mockRequestValidator.mockRestore();
        mockDynamo.mockRestore();
      });

      it('returns status 400', () => {
        expect(response.statusCode).toEqual(400);
      });

      it('returns the persistence error message', () => {
        expect(JSON.parse(response.body).message).toEqual(expectedError);
      });

      it('it returns headers', () => {
        expect(response.headers).toEqual(expectedHeaders);
      });
    });

    describe('given persistence is going to fail', () => {
      let mockDynamo: any;
      const expectedError = 'Dynamo did not like me';
      const expectedHeaders = { header: 'one' };
      const path = '/v3.3b/ed-fi/academicWeeks/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';

      beforeAll(async () => {
        const event: APIGatewayProxyEvent = {
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': false },
          path,
          requestContext: { requestId: 'ApiGatewayRequestId' },
        } as any;
        const context = { awsRequestId: 'LambdaRequestId' } as Context;

        // Setup the request validation to succeed
        mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
          Promise.resolve({
            entityInfo: {
              foreignKeys: ['NK#schoolId=1'],
              naturalKey: 'NK#123',
            },
            errorBody: null,
            metaEdProjectHeaders: expectedHeaders,
          } as unknown as RequestValidator.ResourceValidationResult),
        );

        // Setup the GET request to succeed
        jest.spyOn(Get, 'getById').mockReturnValue(Promise.resolve({ body: '', statusCode: 200 }));

        // Setup the update operation to fail
        mockDynamo = jest.spyOn(backendPlugin(), 'updateEntityById').mockReturnValue(
          Promise.resolve({
            result: 'UNKNOWN_FAILURE',
            failureMessage: expectedError,
          }),
        );

        // Act
        response = await update(event, context);
      });

      afterAll(() => {
        mockRequestValidator.mockRestore();
        mockDynamo.mockRestore();
      });

      it('returns status 500', () => {
        expect(response.statusCode).toEqual(500);
      });

      it('returns the persistence error message', () => {
        expect(JSON.parse(response.body).message).toEqual(expectedError);
      });

      it('it returns headers', () => {
        expect(response.headers).toEqual(expectedHeaders);
      });
    });

    describe('given persistence succeeds', () => {
      let mockDynamo: any;
      const metaEdHeaders = { header: 'one' };
      const path = '/v3.3b/ed-fi/academicWeeks/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';

      beforeAll(async () => {
        const event: APIGatewayProxyEvent = {
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': false },
          path,
          requestContext: { requestId: 'ApiGatewayRequestId' },
        } as any;
        const context = { awsRequestId: 'LambdaRequestId' } as Context;

        // Setup the request validation to succeed
        mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
          Promise.resolve({
            entityInfo: {
              foreignKeys: ['NK#schoolId=1'],
              naturalKey: 'NK#123',
            },
            errorBody: null,
            metaEdProjectHeaders: metaEdHeaders,
          } as unknown as RequestValidator.ResourceValidationResult),
        );

        // Setup the update operation to succeed
        mockDynamo = jest.spyOn(backendPlugin(), 'updateEntityById').mockReturnValue(
          Promise.resolve({
            result: 'UPDATE_SUCCESS',
            failureMessage: null,
          } as unknown as PutResult),
        );

        // Act
        response = await update(event, context);
      });

      afterAll(() => {
        mockRequestValidator.mockRestore();
        mockDynamo.mockRestore();
      });

      it('returns status 204', () => {
        expect(response.statusCode).toEqual(204);
      });

      it('does not return a message body', () => {
        expect(response.body).toEqual('');
      });

      it('it returns headers', () => {
        expect(response.headers).toEqual(metaEdHeaders);
      });
    });
  });
});

describe('given requesting abstract classes', () => {
  const response: APIGatewayProxyResult[] = [];

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      body: '{"id": "0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb", "body": "a body"}',
      headers: { 'reference-validation': false },
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: '/v3.3b/ed-fi/educationOrganizations/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb',
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    response[0] = await update(event, context);

    event.path = '/v3.3b/ed-fi/generalStudentProgramAssociations/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';
    response[1] = await update(event, context);
  });

  it('returns status 404', () => {
    expect(response[0].statusCode).toEqual(404);
    expect(response[1].statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(response[0].body).toEqual(
      '{"message":"Invalid resource \'educationOrganizations\'. The most similar resource is \'educationOrganizationNetworks\'."}',
    );
    expect(response[1].body).toEqual(
      '{"message":"Invalid resource \'generalStudentProgramAssociations\'. The most similar resource is \'studentProgramAssociations\'."}',
    );
  });
});

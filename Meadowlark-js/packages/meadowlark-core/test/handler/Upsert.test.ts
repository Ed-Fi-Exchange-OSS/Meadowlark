// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { upsert } from '../../src/handler/Upsert';
import * as RequestValidator from '../../src/validation/RequestValidator';
import { UpsertResult } from '../../src/message/UpsertResult';
import { getDocumentStore } from '../../src/plugin/PluginLoader';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../src/handler/FrontendResponse';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

describe('when posting a request to upsert a new resource', () => {
  describe('given there is no request body', () => {
    let response: FrontendResponse;

    beforeAll(async () => {
      const event: FrontendRequest = {
        ...newFrontendRequest(),

        path: '/v3.3b/ed-fi/academicWeeks',
      };

      response = await upsert(event);
    }, 6000);

    it('returns status 400', () => {
      expect(response.statusCode).toEqual(400);
    });

    it('returns an error message', () => {
      expect(JSON.parse(response.body).message).toEqual('Missing body');
    });
  });

  describe('given there is a malformed request body', () => {
    let response: FrontendResponse;

    beforeAll(async () => {
      const event: FrontendRequest = {
        ...newFrontendRequest(),

        body: 'this is not a JSON object',

        path: '/v3.3b/ed-fi/academicWeeks',
      };

      response = await upsert(event);
    });

    it('returns status 400', () => {
      expect(response.statusCode).toEqual(400);
    });

    it('returns an error message', () => {
      expect(JSON.parse(response.body).message).toEqual('Malformed body');
    });
  });

  describe('given an invalid object', () => {
    let response: FrontendResponse;
    let mockRequestValidator: any;
    const expectedError = { a: 'b' };
    const expectedHeaders = { header: 'one' };

    beforeAll(async () => {
      const event: FrontendRequest = {
        ...newFrontendRequest(),

        body: '{"id": "string", "weekIdentifier": "string"}',

        path: '/v3.3b/ed-fi/academicWeeks',
      };

      mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
        Promise.resolve({
          documentInfo: {},
          errorBody: expectedError,
          headerMetadata: expectedHeaders,
        } as unknown as RequestValidator.ResourceValidationResult),
      );

      response = await upsert(event);
    });

    afterAll(() => mockRequestValidator.mockRestore());

    it('returns status 400', () => {
      expect(response.statusCode).toEqual(400);
    });

    it('returns an error message', () => {
      expect(response.body).toEqual(expectedError);
    });

    it('it returns headers', () => {
      expect(response.headers).toEqual(expectedHeaders);
    });
  });

  describe('given a valid object', () => {
    describe('given persistence is going to throw a reference error on insert', () => {
      let response: FrontendResponse;
      let mockRequestValidator: any;
      let mockDynamo: any;
      const expectedError = 'Dynamo did not like me';
      const expectedHeaders = { header: 'one' };

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': 'false' },

          path: '/v3.3b/ed-fi/academicWeeks',
        };

        // Setup the request validation to succeed
        mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
          Promise.resolve({
            documentInfo: {
              documentReferences: [[{ name: 'schoolId', value: '1' }]],
              documentIdentity: [{ name: 'x', value: '123' }],
            },
            errorBody: null,
            headerMetadata: expectedHeaders,
          } as unknown as RequestValidator.ResourceValidationResult),
        );

        // Setup the upsert operation to fail
        mockDynamo = jest.spyOn(getDocumentStore(), 'upsertDocument').mockReturnValue(
          Promise.resolve({
            response: 'INSERT_FAILURE_REFERENCE',
            failureMessage: expectedError,
          }),
        );

        // Act
        response = await upsert(event);
      });

      afterAll(() => {
        mockRequestValidator.mockRestore();
        mockDynamo.mockRestore();
      });

      it('returns status 400', () => {
        expect(response.statusCode).toEqual(400);
      });

      it('returns an error message', () => {
        expect(JSON.parse(response.body).message).toEqual(expectedError);
      });

      it('it returns headers', () => {
        expect(response.headers).toEqual(expectedHeaders);
      });
    });

    describe('given persistence is going to throw a reference error on update though did not on insert attempt', () => {
      let response: FrontendResponse;
      let mockRequestValidator: any;
      let mockDynamo: any;
      const expectedHeaders = { header: 'one' };

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': 'false' },

          path: '/v3.3b/ed-fi/academicWeeks',
        };

        // Setup the request validation to succeed
        mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
          Promise.resolve({
            documentInfo: {
              documentReferences: [[{ name: 'schoolId', value: '1' }]],
              documentIdentity: [{ name: 'x', value: '123' }],
            },
            errorBody: null,
            headerMetadata: expectedHeaders,
          } as unknown as RequestValidator.ResourceValidationResult),
        );

        // Setup the upsert operation to fail
        mockDynamo = jest.spyOn(getDocumentStore(), 'upsertDocument').mockReturnValue(
          Promise.resolve({
            response: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: 'Reference failure',
          }),
        );

        // Act
        response = await upsert(event);
      });

      afterAll(() => {
        mockRequestValidator.mockRestore();
        mockDynamo.mockRestore();
      });

      it('returns status 409', () => {
        expect(response.statusCode).toEqual(409);
      });

      it('does not return a message body', () => {
        expect(response.body).toEqual('');
      });

      it('it returns headers', () => {
        expect(response.headers).toEqual(expectedHeaders);
      });
    });

    describe('given persistence is going to fail', () => {
      let response: FrontendResponse;
      let mockRequestValidator: any;
      let mockDynamo: any;
      const expectedError = 'Dynamo did not like me';
      const expectedHeaders = { header: 'one' };

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': 'false' },

          path: '/v3.3b/ed-fi/academicWeeks',
        };

        // Setup the request validation to succeed
        mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
          Promise.resolve({
            documentInfo: {
              documentReferences: [[{ name: 'schoolId', value: '1' }]],
              documentIdentity: [{ name: 'x', value: '123' }],
            },
            errorBody: null,
            headerMetadata: expectedHeaders,
          } as unknown as RequestValidator.ResourceValidationResult),
        );

        // Setup the upsert operation to fail
        mockDynamo = jest.spyOn(getDocumentStore(), 'upsertDocument').mockReturnValue(
          Promise.resolve({
            response: 'UNKNOWN_FAILURE',
            failureMessage: expectedError,
          }),
        );

        // Act
        response = await upsert(event);
      });

      afterAll(() => {
        mockRequestValidator.mockRestore();
        mockDynamo.mockRestore();
      });

      it('returns status 500', () => {
        expect(response.statusCode).toEqual(500);
      });

      it('does not return a message body', () => {
        expect(response.body).toEqual('');
      });

      it('it returns headers', () => {
        expect(response.headers).toEqual(expectedHeaders);
      });
    });

    describe('given persistence succeeds as insert', () => {
      let response: FrontendResponse;
      let mockRequestValidator: any;
      let mockDynamo: any;
      const metaEdHeaders = { header: 'one' };
      const location = `/v3.3b/ed-fi/academicWeeks/02a9c5eddbd4bad9b107410254ef41af66cbe230107df7d640ad9a21`;

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': 'false' },

          path: '/v3.3b/ed-fi/academicWeeks',
        };

        // Setup the request validation to succeed
        mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
          Promise.resolve({
            documentInfo: {
              documentReferences: [[{ name: 'schoolId', value: '1' }]],
              documentIdentity: [{ name: 'x', value: '123' }],
            },
            errorBody: null,
            headerMetadata: metaEdHeaders,
          } as unknown as RequestValidator.ResourceValidationResult),
        );

        // Setup the upsert operation to fail
        mockDynamo = jest.spyOn(getDocumentStore(), 'upsertDocument').mockReturnValue(
          Promise.resolve({
            response: 'INSERT_SUCCESS',
            failureMessage: null,
          } as unknown as UpsertResult),
        );

        // Act
        response = await upsert(event);
      });

      afterAll(() => {
        mockRequestValidator.mockRestore();
        mockDynamo.mockRestore();
      });

      it('returns status 201', () => {
        expect(response.statusCode).toEqual(201);
      });

      it('does not return a message body', () => {
        expect(response.body).toEqual('');
      });

      it('it returns headers', () => {
        const expectedHeaders = {
          ...metaEdHeaders,
          Location: location,
        };

        expect(response.headers).toEqual(expectedHeaders);
      });
    });

    describe('given persistence succeeds as update', () => {
      let response: FrontendResponse;
      let mockRequestValidator: any;
      let mockDynamo: any;
      const metaEdHeaders = { header: 'one' };
      const location = `/v3.3b/ed-fi/academicWeeks/02a9c5eddbd4bad9b107410254ef41af66cbe230107df7d640ad9a21`;

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': 'false' },

          path: '/v3.3b/ed-fi/academicWeeks',
        };

        // Setup the request validation to succeed
        mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
          Promise.resolve({
            documentInfo: {
              documentReferences: [[{ name: 'schoolId', value: '1' }]],
              documentIdentity: [{ name: 'x', value: '123' }],
            },
            errorBody: null,
            headerMetadata: metaEdHeaders,
          } as unknown as RequestValidator.ResourceValidationResult),
        );

        // Setup the upsert operation to fail
        mockDynamo = jest.spyOn(getDocumentStore(), 'upsertDocument').mockReturnValue(
          Promise.resolve({
            response: 'UPDATE_SUCCESS',
            failureMessage: null,
          } as unknown as UpsertResult),
        );

        // Act
        response = await upsert(event);
      });

      afterAll(() => {
        mockRequestValidator.mockRestore();
        mockDynamo.mockRestore();
      });

      it('returns status 200', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('does not return a message body', () => {
        expect(response.body).toEqual('');
      });

      it('it returns headers', () => {
        const expectedHeaders = {
          ...metaEdHeaders,
          Location: location,
        };

        expect(response.headers).toEqual(expectedHeaders);
      });
    });
  });
});

describe('given requesting abstract classes', () => {
  const response: FrontendResponse[] = [];

  beforeAll(async () => {
    const event: FrontendRequest = {
      ...newFrontendRequest(),
      body: '{"id": "string", "weekIdentifier": "string"}',
      headers: { 'reference-validation': 'false' },

      path: 'local/v3.3b/ed-fi/educationOrganizations',
    };

    // Act
    response[0] = await upsert(event);

    event.path = 'local/v3.3b/ed-fi/GeneralStudentProgramAssociations';
    response[1] = await upsert(event);
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
      '{"message":"Invalid resource \'GeneralStudentProgramAssociations\'. The most similar resource is \'studentProgramAssociations\'."}',
    );
  });
});

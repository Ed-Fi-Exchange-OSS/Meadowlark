// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as GetById from '../../src/handler/GetById';
import { update } from '../../src/handler/Update';
import * as RequestValidator from '../../src/validation/RequestValidator';
import { UpdateResult } from '../../src/message/UpdateResult';
import { getDocumentStore } from '../../src/plugin/PluginLoader';
import { FrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

describe('given there is no request body', () => {
  let response: FrontendResponse;
  const path = '/v3.3b/ed-fi/academicWeeks/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';

  beforeAll(async () => {
    const event: FrontendRequest = {
      ...newFrontendRequest(),
      body: null,
      headers: {},
      path,
    };

    response = await update(event);
  }, 5100);

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns an error message', () => {
    expect(response.body).toEqual(JSON.stringify({ message: 'Missing body' }));
  });
});

describe('given there is a malformed request body', () => {
  let response: FrontendResponse;
  const path = '/v3.3b/ed-fi/academicWeeks/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';

  beforeAll(async () => {
    const event: FrontendRequest = {
      ...newFrontendRequest(),
      body: 'this is not a JSON object',
      path,
    };

    response = await update(event);
  });

  it('returns status 400', () => {
    expect(response.statusCode).toEqual(400);
  });

  it('returns an error message', () => {
    expect(response.body).toEqual(JSON.stringify({ message: 'Malformed body' }));
  });
});

describe('given a completely missing resource path', () => {
  let response: FrontendResponse;
  let mockRequestValidator: any;
  const path = '/whatever';

  beforeAll(async () => {
    const event: FrontendRequest = {
      ...newFrontendRequest(),
      body: '{"id": "string", "weekIdentifier": "string"}',
      path,
    };

    // Setup the request validation to succeed
    mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
      Promise.resolve({
        documentInfo: {
          documentReferences: [[{ name: 'schoolId', value: '1' }]],
          documentIdentity: [{ name: 'x', value: '123' }],
        },
        errorBody: null,
        headerMetadata: {},
      } as unknown as RequestValidator.ResourceValidationResult),
    );

    // Act
    response = await update(event);
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
  let response: FrontendResponse;
  let mockRequestValidator: any;

  describe('given the object does not exist', () => {
    let mockDynamo: any;
    const metaEdHeaders = { header: 'one' };
    const path = '/v3.3b/ed-fi/academicWeeks/02a9c5eddbd4bad9b107410254ef41af66cbe230107df7d640ad9a21';

    beforeAll(async () => {
      const event: FrontendRequest = {
        ...newFrontendRequest(),
        body: '{"id": "string", "weekIdentifier": "string"}',
        headers: { 'reference-validation': 'false' },
        path,
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

      // Setup the update operation to fail
      mockDynamo = jest.spyOn(getDocumentStore(), 'updateDocumentById').mockReturnValue(
        Promise.resolve({
          response: 'UPDATE_FAILURE_NOT_EXISTS',
          failureMessage: 'Does not exist',
        }),
      );

      // Act
      response = await update(event);
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
      const path = '/v3.3b/ed-fi/academicWeeks/02a9c5eddbd4bad9b107410254ef41af66cbe230107df7d640ad9a21';

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),

          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': 'false' },
          path,
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

        // Setup the update operation to fail
        mockDynamo = jest.spyOn(getDocumentStore(), 'updateDocumentById').mockReturnValue(
          Promise.resolve({
            response: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: expectedError,
          }),
        );

        // Act
        response = await update(event);
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
      const path = '/v3.3b/ed-fi/academicWeeks/02a9c5eddbd4bad9b107410254ef41af66cbe230107df7d640ad9a21';

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': 'false' },
          path,
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

        // Setup the GET request to succeed
        jest.spyOn(GetById, 'getById').mockReturnValue(Promise.resolve({ body: '', statusCode: 200 }));

        // Setup the update operation to fail
        mockDynamo = jest.spyOn(getDocumentStore(), 'updateDocumentById').mockReturnValue(
          Promise.resolve({
            response: 'UNKNOWN_FAILURE',
            failureMessage: expectedError,
          }),
        );

        // Act
        response = await update(event);
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
      const path = '/v3.3b/ed-fi/academicWeeks/02a9c5eddbd4bad9b107410254ef41af66cbe230107df7d640ad9a21';

      beforeAll(async () => {
        const event: FrontendRequest = {
          ...newFrontendRequest(),
          body: '{"id": "string", "weekIdentifier": "string"}',
          headers: { 'reference-validation': 'false' },
          path,
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

        // Setup the update operation to succeed
        mockDynamo = jest.spyOn(getDocumentStore(), 'updateDocumentById').mockReturnValue(
          Promise.resolve({
            response: 'UPDATE_SUCCESS',
            failureMessage: null,
          } as unknown as UpdateResult),
        );

        // Act
        response = await update(event);
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
  const response: FrontendResponse[] = [];

  beforeAll(async () => {
    const event: FrontendRequest = {
      ...newFrontendRequest(),

      body: '{"id": "0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb", "body": "a body"}',
      headers: { 'reference-validation': 'false' },
      path: '/v3.3b/ed-fi/educationOrganizations/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb',
    };

    // Act
    response[0] = await update(event);

    event.path = '/v3.3b/ed-fi/generalStudentProgramAssociations/0c48a5757d4a3589eada048f37bcf7cf832a77c1dc838152ff2dadcb';
    response[1] = await update(event);
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

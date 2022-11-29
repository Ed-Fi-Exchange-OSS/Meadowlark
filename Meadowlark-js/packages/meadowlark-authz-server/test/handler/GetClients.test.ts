// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getClients } from '../../src/handler/GetClient';
import * as JwtAction from '../../src/security/JwtAction';
import * as AuthorizationPluginLoader from '../../src/plugin/AuthorizationPluginLoader';
import { AuthorizationRequest, newAuthorizationRequest } from '../../src/handler/AuthorizationRequest';
import { AuthorizationResponse } from '../../src/handler/AuthorizationResponse';
import { NoAuthorizationStorePlugin } from '../../src/plugin/NoAuthorizationStorePlugin';
import { newJwtStatus } from '../../src/security/JwtStatus';
import { GetAllAuthorizationClientsResult } from '../../src/message/GetAllAuthorizationClientsResult';
import { GetClientBody } from '../../src/model/ClientBody';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

const authorizationRequest: AuthorizationRequest = {
  ...newAuthorizationRequest(),
  path: '/oauth/client/11111111-1111-1111-1111111111111111',
};

const client1: GetClientBody = {
  clientName: 'Hometown SIS',
  roles: ['vendor', 'assessment'],
  active: false,
};

const client2: GetClientBody = {
  clientName: '2 Hometown SIS',
  roles: ['vendor'],
  active: true,
};

describe('given the authorization store is going to fail', () => {
  let response: AuthorizationResponse;
  let mockAuthorizationStore: any;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
      ...NoAuthorizationStorePlugin,
      getAllAuthorizationClients: async () =>
        Promise.resolve({
          response: 'UNKNOWN_FAILURE',
        }),
    });

    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isValid: true,
      roles: ['admin'],
    });

    // Act
    response = await getClients(authorizationRequest);
  });

  afterAll(() => {
    mockAuthorizationStore.mockRestore();
    mockMeadowlarkCore.mockRestore();
  });

  it('returns status 500', () => {
    expect(response.statusCode).toEqual(500);
  });

  it('does not return a message body', () => {
    expect(response.body).toEqual('');
  });
});

describe('given a valid admin user', () => {
  describe('given there is one client', () => {
    let response: AuthorizationResponse;
    let mockAuthorizationStore: any;
    let mockMeadowlarkCore: any;

    beforeAll(async () => {
      mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
        ...NoAuthorizationStorePlugin,
        getAllAuthorizationClients: async () =>
          Promise.resolve({
            response: 'GET_SUCCESS',
            clients: [client1],
          } as GetAllAuthorizationClientsResult),
      });

      mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
        ...newJwtStatus(),
        isValid: true,
        roles: ['admin'],
      });

      // Act
      response = await getClients(authorizationRequest);
    });

    afterAll(() => {
      mockAuthorizationStore.mockRestore();
      mockMeadowlarkCore.mockRestore();
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });

    it('returns a proper message body', () => {
      expect(response.body).toMatchInlineSnapshot(
        `"[{"active":false,"clientId":"11111111-1111-1111-1111111111111111","clientName":"Hometown SIS","roles":["vendor","assessment"]}]"`,
      );
    });

    describe('given there are two clients', () => {
      let response: AuthorizationResponse;
      let mockAuthorizationStore: any;
      let mockMeadowlarkCore: any;

      beforeAll(async () => {
        mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
          ...NoAuthorizationStorePlugin,
          getAllAuthorizationClients: async () =>
            Promise.resolve({
              response: 'GET_SUCCESS',
              clients: [client1, client2],
            } as GetAllAuthorizationClientsResult),
        });

        mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
          ...newJwtStatus(),
          isValid: true,
          roles: ['admin'],
        });

        // Act
        response = await getClients(authorizationRequest);
      });

      afterAll(() => {
        mockAuthorizationStore.mockRestore();
        mockMeadowlarkCore.mockRestore();
      });

      it('returns status 200', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('returns a proper message body', () => {
        expect(response.body).toMatchInlineSnapshot(
          `"[{"active":false,"clientId":"11111111-1111-1111-1111111111111111","clientName":"Hometown SIS","roles":["vendor","assessment"]}]"`,
        );
      });
  });

  describe('given there are no clients', () => {
    let response: AuthorizationResponse;
    let mockAuthorizationStore: any;
    let mockMeadowlarkCore: any;

    beforeAll(async () => {
      mockAuthorizationStore = jest.spyOn(AuthorizationPluginLoader, 'getAuthorizationStore').mockReturnValue({
        ...NoAuthorizationStorePlugin,
        getAllAuthorizationClients: async () =>
        Promise.resolve({
          response: 'GET_SUCCESS',
          clients: [],
        } as GetAllAuthorizationClientsResult),
      });

      mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
        ...newJwtStatus(),
        isValid: true,
        roles: ['admin'],
      });

      // Act
      response = await getClients(authorizationRequest);
    });

    afterAll(() => {
      mockAuthorizationStore.mockRestore();
      mockMeadowlarkCore.mockRestore();
    });

    it('returns status 200', () => {
      expect(response.statusCode).toEqual(200);
    });

    it('returns a proper message body', () => {
      expect(response.body).toMatchInlineSnapshot('');
    });
  });
});

describe('given missing authorization token', () => {
  let response: AuthorizationResponse;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isMissing: true,
    });

    // Act
    response = await getClients(authorizationRequest);
  });

  afterAll(() => {
    mockMeadowlarkCore.mockRestore();
  });

  it('returns error response', () => {
    expect(response).toMatchInlineSnapshot(`
      {
        "body": "{ "error": "invalid_client", "error_description": "Authorization token not provided" }",
        "headers": {
          "WWW-Authenticate": "Bearer",
        },
        "statusCode": 401,
      }
    `);
  });
});

describe('given expired authorization token', () => {
  let response: AuthorizationResponse;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isMissing: false,
      isExpired: true,
    });

    // Act
    response = await getClients(authorizationRequest);
  });

  afterAll(() => {
    mockMeadowlarkCore.mockRestore();
  });

  it('returns error response', () => {
    expect(response).toMatchInlineSnapshot(`
      {
        "body": "{ "error": "invalid_token", "error_description": "Token is expired" }",
        "headers": {
          "WWW-Authenticate": "Bearer",
        },
        "statusCode": 401,
      }
    `);
  });
});

describe('given non-admin authorization token', () => {
  let response: AuthorizationResponse;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isMissing: false,
      isExpired: false,
      isValid: true,
      roles: ['vendor'],
    });

    // Act
    response = await getClients(authorizationRequest);
  });

  afterAll(() => {
    mockMeadowlarkCore.mockRestore();
  });

  it('returns error response', () => {
    expect(response.body).toMatchInlineSnapshot(`""`);
  });
});

describe('given invalid authorization token', () => {
  let response: AuthorizationResponse;
  let mockMeadowlarkCore: any;

  beforeAll(async () => {
    mockMeadowlarkCore = jest.spyOn(JwtAction, 'verifyJwt').mockReturnValue({
      ...newJwtStatus(),
      isMissing: false,
      isExpired: false,
      roles: ['admin'],
      isValid: false,
    });

    // Act
    response = await getClients(authorizationRequest);
  });

  afterAll(() => {
    mockMeadowlarkCore.mockRestore();
  });

  it('returns error response', () => {
    expect(response.body).toMatchInlineSnapshot(
      `"{ "error": "invalid_token", "error_description": "Invalid authorization token" }"`,
    );
  });
});

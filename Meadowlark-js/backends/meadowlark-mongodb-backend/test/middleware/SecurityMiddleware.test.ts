// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, FrontendResponse, newFrontendRequest, newFrontendResponseSuccess } from '@edfi/meadowlark-core';
import { newFrontendRequestMiddleware } from '@edfi/meadowlark-core/src/handler/FrontendRequest';
import { newPathComponents } from '@edfi/meadowlark-core/src/model/PathComponents';
import { securityMiddleware } from '../../src/security/SecurityMiddleware';
import * as OwnershipSecurity from '../../src/repository/OwnershipSecurity';

describe('given the upsert where response already posted', () => {
  let result;
  const mongoClientMock = {};

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents() },
    },
  };

  const frontendResponse: FrontendResponse = newFrontendResponseSuccess();

  beforeAll(async () => {
    result = await securityMiddleware({ frontendRequest, frontendResponse }, mongoClientMock as any);
  });

  it('should return the original arguments without modification', async () => {
    expect(result.frontendResponse.statusCode).toBe(200);

    expect(result.frontendRequest).toEqual({
      ...newFrontendRequest(),
      action: 'upsert',
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: { ...newPathComponents() },
      },
    });
  });
});

describe('given the upsert where authorization strategy type is different than OWNERSHIP_BASED', () => {
  let result;
  const mongoClientMock = {};
  const frontendResponse: any = null;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      pathComponents: { ...newPathComponents() },
    },
  };

  beforeAll(async () => {
    result = await securityMiddleware({ frontendRequest, frontendResponse }, mongoClientMock as any);
  });

  it('should return the original arguments without modification', async () => {
    expect(result.frontendResponse).toBe(null);

    expect(result.frontendRequest).toEqual({
      ...newFrontendRequest(),
      action: 'upsert',
      middleware: {
        ...newFrontendRequestMiddleware(),
        pathComponents: { ...newPathComponents() },
      },
    });
  });
});

describe('given the upsert where AuthorizationStrategy type is equal to OWNERSHIP_BASED and SecurityResult equal to ACCESS_APPROVED', () => {
  let result;
  const mongoClientMock = {};
  const frontendResponse: any = null;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      security: {
        authorizationStrategy: {
          type: 'OWNERSHIP_BASED',
        },
        clientId: 'someClientId',
      },
      pathComponents: { ...newPathComponents() },
    },
  };

  beforeAll(async () => {
    jest.spyOn(OwnershipSecurity, 'rejectByOwnershipSecurity').mockResolvedValueOnce('ACCESS_APPROVED');

    result = await securityMiddleware({ frontendRequest, frontendResponse }, mongoClientMock as any);
  });

  it('should return the original arguments without modification', async () => {
    expect(result.frontendResponse).toBe(null);
    expect(result.frontendRequest).toEqual({
      ...newFrontendRequest(),
      action: 'upsert',
      middleware: {
        ...newFrontendRequestMiddleware(),
        security: {
          authorizationStrategy: {
            type: 'OWNERSHIP_BASED',
          },
          clientId: 'someClientId',
        },
        pathComponents: { ...newPathComponents() },
      },
    });
  });
});

describe('given the upsert where AuthorizationStrategy type is equal to OWNERSHIP_BASED and SecurityResult equal to NOT_APPLICABLE', () => {
  let result;
  const mongoClientMock = {};
  const frontendResponse: any = null;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      security: {
        authorizationStrategy: {
          type: 'OWNERSHIP_BASED',
        },
        clientId: 'someClientId',
      },
      pathComponents: { ...newPathComponents() },
    },
  };

  beforeAll(async () => {
    jest.spyOn(OwnershipSecurity, 'rejectByOwnershipSecurity').mockResolvedValueOnce('NOT_APPLICABLE');

    result = await securityMiddleware({ frontendRequest, frontendResponse }, mongoClientMock as any);
  });

  it('should return the original arguments without modification', async () => {
    expect(result.frontendResponse).toBe(null);
    expect(result.frontendRequest).toEqual({
      ...newFrontendRequest(),
      action: 'upsert',
      middleware: {
        ...newFrontendRequestMiddleware(),
        security: {
          authorizationStrategy: {
            type: 'OWNERSHIP_BASED',
          },
          clientId: 'someClientId',
        },
        pathComponents: { ...newPathComponents() },
      },
    });
  });
});

describe('given the upsert where AuthorizationStrategy type is equal to OWNERSHIP_BASED and SecurityResult equal to UNKNOWN_FAILURE', () => {
  let result;
  const mongoClientMock = {};
  const frontendResponse: any = null;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      security: {
        authorizationStrategy: {
          type: 'OWNERSHIP_BASED',
        },
        clientId: 'someClientId',
      },
      pathComponents: { ...newPathComponents() },
    },
  };

  beforeAll(async () => {
    jest.spyOn(OwnershipSecurity, 'rejectByOwnershipSecurity').mockResolvedValueOnce('UNKNOWN_FAILURE');

    result = await securityMiddleware({ frontendRequest, frontendResponse }, mongoClientMock as any);
  });

  it('should respond with an internal server error code', async () => {
    expect(result.frontendResponse).toEqual({
      statusCode: 500,
      headers: {},
      body: '',
    });
    expect(result.frontendRequest).toEqual({
      ...newFrontendRequest(),
      action: 'upsert',
      middleware: {
        ...newFrontendRequestMiddleware(),
        security: {
          authorizationStrategy: {
            type: 'OWNERSHIP_BASED',
          },
          clientId: 'someClientId',
        },
        pathComponents: { ...newPathComponents() },
      },
    });
  });
});

describe('given the upsert where AuthorizationStrategy type is equal to OWNERSHIP_BASED and SecurityResult equal to ACCESS_DENIED', () => {
  let result;
  const mongoClientMock = {};
  const frontendResponse: any = null;

  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    action: 'upsert',
    middleware: {
      ...newFrontendRequestMiddleware(),
      security: {
        authorizationStrategy: {
          type: 'OWNERSHIP_BASED',
        },
        clientId: 'someClientId',
      },
      pathComponents: { ...newPathComponents() },
    },
  };

  beforeAll(async () => {
    jest.spyOn(OwnershipSecurity, 'rejectByOwnershipSecurity').mockResolvedValueOnce('ACCESS_DENIED');

    result = await securityMiddleware({ frontendRequest, frontendResponse }, mongoClientMock as any);
  });

  it('should respond with a Forbidden error code', async () => {
    expect(result.frontendResponse).toEqual({
      statusCode: 403,
      headers: {},
      body: '',
    });
    expect(result.frontendRequest).toEqual({
      ...newFrontendRequest(),
      action: 'upsert',
      middleware: {
        ...newFrontendRequestMiddleware(),
        security: {
          authorizationStrategy: {
            type: 'OWNERSHIP_BASED',
          },
          clientId: 'someClientId',
        },
        pathComponents: { ...newPathComponents() },
      },
    });
  });
});

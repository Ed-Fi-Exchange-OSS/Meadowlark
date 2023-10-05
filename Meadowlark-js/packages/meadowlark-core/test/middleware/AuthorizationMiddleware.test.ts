// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { AxiosResponse } from 'axios';
import { authorize, clearCaches } from '../../src/middleware/AuthorizationMiddleware';
import * as OAuthFetch from '../../src/middleware/OAuthFetch';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { setupMockConfiguration } from '../ConfigHelper';

const newAxiosResponse = () => ({ status: 0, data: {}, headers: {}, config: {}, statusText: '' }) as AxiosResponse;

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    setupMockConfiguration();
    mockFetchOwnAccessToken = jest.spyOn(OAuthFetch, 'fetchOwnAccessToken');
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls mockFetchOwnAccessToken', () => {
    expect(mockFetchOwnAccessToken).not.toHaveBeenCalled();
  });

  it('never calls fetchClientTokenVerification', () => {
    expect(mockFetchClientTokenVerification).not.toHaveBeenCalled();
  });
});

describe('given a previous middleware has provided security information', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    middleware: {
      ...newFrontendRequestMiddleware(),
      security: {
        authorizationStrategy: { type: 'OWNERSHIP_BASED' },
        clientId: 'clientId',
      },
      validateResources: true,
    },
  };
  let resultChain: MiddlewareModel;

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    setupMockConfiguration();
    mockFetchOwnAccessToken = jest.spyOn(OAuthFetch, 'fetchOwnAccessToken');
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a null response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });

  it('never calls mockFetchOwnAccessToken', () => {
    expect(mockFetchOwnAccessToken).not.toHaveBeenCalled();
  });

  it('never calls fetchClientTokenVerification', () => {
    expect(mockFetchClientTokenVerification).not.toHaveBeenCalled();
  });
});

describe('given a request has no authorization header', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();

  let resultChain: MiddlewareModel;

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    setupMockConfiguration();
    mockFetchOwnAccessToken = jest.spyOn(OAuthFetch, 'fetchOwnAccessToken');
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 400 response with invalid authorization header', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(400);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid authorization header",
      }
    `);
  });

  it('never calls mockFetchOwnAccessToken', () => {
    expect(mockFetchOwnAccessToken).not.toHaveBeenCalled();
  });

  it('never calls fetchClientTokenVerification', () => {
    expect(mockFetchClientTokenVerification).not.toHaveBeenCalled();
  });
});

describe('given a request has non-bearer authorization header', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'not-bearer 123',
    },
  };

  let resultChain: MiddlewareModel;

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    setupMockConfiguration();
    mockFetchOwnAccessToken = jest.spyOn(OAuthFetch, 'fetchOwnAccessToken');
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 400 response with invalid authorization header', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(400);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid authorization header",
      }
    `);
  });

  it('never calls mockFetchOwnAccessToken', () => {
    expect(mockFetchOwnAccessToken).not.toHaveBeenCalled();
  });

  it('never calls fetchClientTokenVerification', () => {
    expect(mockFetchClientTokenVerification).not.toHaveBeenCalled();
  });
});

describe('given an invalid configuration of Meadowlark client secret', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 }));
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 500 response due to OAuth server 401', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(500);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid Meadowlark to OAuth server configuration",
      }
    `);
  });

  it('never calls fetchClientTokenVerification', () => {
    expect(mockFetchClientTokenVerification).not.toHaveBeenCalled();
  });
});

describe('given an invalid configuration of Meadowlark client id', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 404 }));
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 500 response due to OAuth server 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(500);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid Meadowlark to OAuth server configuration",
      }
    `);
  });

  it('never calls fetchClientTokenVerification', () => {
    expect(mockFetchClientTokenVerification).not.toHaveBeenCalled();
  });
});

describe('given a 500 from OAuth server when requesting own token', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  let mockFetchClientTokenVerification;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 500 }));
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to OAuth server 500', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Request from Meadowlark to OAuth server failed",
      }
    `);
  });

  it('never calls fetchClientTokenVerification', () => {
    expect(mockFetchClientTokenVerification).not.toHaveBeenCalled();
  });
});

describe('given an exception when requesting own token from OAuth server', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  let mockFetchClientTokenVerification;

  beforeAll(async () => {
    setupMockConfiguration();
    jest.spyOn(OAuthFetch, 'fetchOwnAccessToken').mockImplementationOnce(async () => Promise.reject(new Error()));

    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to exception', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Request from Meadowlark to OAuth server failed",
      }
    `);
  });

  it('never calls fetchClientTokenVerification', () => {
    expect(mockFetchClientTokenVerification).not.toHaveBeenCalled();
  });
});

describe('given a valid own token, but then the own token expires on client token validation attempt, and then the own token refresh fails with server error', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      )
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 500 })); // OAuth server crash on own token refresh

    jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 })); // own token no longer valid

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to OAuth server 500 on own token refresh', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Request from Meadowlark to OAuth server failed",
      }
    `);
  });
});

describe('given a valid own token, but then the own token expires on client token validation attempt, and then the own token refresh fails', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      )
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 })); // own token refresh, still not valid

    jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 })); // own token no longer valid

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 500 response due to OAuth server 401 on own token refresh', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(500);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`
      {
        "error": "Invalid Meadowlark to OAuth server configuration",
      }
    `);
  });
});

describe('given the client token is not a well-formed JWT', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      );

    jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 400 })); // verification fails, client token not well-formed

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 401 response due to OAuth server 400 on client token validation', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(401);
    expect(resultChain.frontendResponse?.body).toBeUndefined();
  });
});

describe('given the client token is not active', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      );

    jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 200, data: { active: false } }));

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 401 response due to client token validation responding with inactive', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(401);
    expect(resultChain.frontendResponse?.body).toBeUndefined();
  });
});

describe('given the client token is active for a vendor without assessment role', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      );

    jest.spyOn(OAuthFetch, 'fetchClientTokenVerification').mockImplementationOnce(async () =>
      Promise.resolve({
        ...newAxiosResponse(),
        status: 200,
        data: { active: true, roles: ['vendor'], client_id: 'clientId' },
      }),
    );

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a FrontEndRequest with client information added', () => {
    expect(resultChain.frontendRequest.middleware.security).toMatchInlineSnapshot(`
      {
        "authorizationStrategy": {
          "type": "OWNERSHIP_BASED",
        },
        "clientId": "clientId",
      }
    `);
  });

  it('returns no FrontEndResponse', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

describe('given the client token is active for a vendor with assessment role', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      );

    jest.spyOn(OAuthFetch, 'fetchClientTokenVerification').mockImplementationOnce(async () =>
      Promise.resolve({
        ...newAxiosResponse(),
        status: 200,
        data: { active: true, roles: ['vendor', 'assessment'], client_id: 'clientId' },
      }),
    );

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a FrontEndRequest with client information added', () => {
    expect(resultChain.frontendRequest.middleware.security).toMatchInlineSnapshot(`
      {
        "authorizationStrategy": {
          "type": "OWNERSHIP_BASED",
        },
        "clientId": "clientId",
      }
    `);
  });

  it('returns no FrontEndResponse', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

describe('given a 500 from the OAuth server on client token verification', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      );

    jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 500 }));

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to client token validation failing with a 500', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toBeUndefined();
  });
});

describe('given an exception during the client token verification call to the OAuth server', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      );

    jest.spyOn(OAuthFetch, 'fetchClientTokenVerification').mockImplementationOnce(async () => Promise.reject(new Error()));

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 500 response due to client token validation failing with an exception', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(500);
    expect(resultChain.frontendResponse?.body).toBeUndefined();
  });
});

describe('given the own token requires a refresh, and the client token is active', () => {
  const frontendRequest: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(
        async () => Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }), // valid the first time
      )
      .mockImplementationOnce(
        async () => Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }), // valid the second time too
      );

    jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 })) // own token from first time expires
      .mockImplementationOnce(async () =>
        Promise.resolve({
          ...newAxiosResponse(),
          status: 200,
          data: { active: true, roles: ['vendor'], client_id: 'clientId' },
        }),
      );

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a FrontEndRequest with client information added', () => {
    expect(resultChain.frontendRequest.middleware.security).toMatchInlineSnapshot(`
      {
        "authorizationStrategy": {
          "type": "OWNERSHIP_BASED",
        },
        "clientId": "clientId",
      }
    `);
  });

  it('returns no FrontEndResponse', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

describe('given two calls for verification with different client ids', () => {
  const frontendRequest1: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  const frontendRequest2: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer abcdef',
    },
  };

  let resultChain1: MiddlewareModel;
  let resultChain2: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      );

    jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () =>
        Promise.resolve({
          ...newAxiosResponse(),
          status: 200,
          data: { active: true, roles: ['vendor'], client_id: 'clientId1' },
        }),
      )
      .mockImplementationOnce(async () =>
        Promise.resolve({
          ...newAxiosResponse(),
          status: 200,
          data: { active: true, roles: ['vendor', 'assessment'], client_id: 'clientId2' },
        }),
      );

    // Act
    resultChain1 = await authorize({ frontendRequest: frontendRequest1, frontendResponse: null });
    resultChain2 = await authorize({ frontendRequest: frontendRequest2, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request for call 1', () => {
    expect(resultChain1.frontendRequest).toBe(frontendRequest1);
  });

  it('returns a FrontEndRequest with client information added for call 1', () => {
    expect(resultChain1.frontendRequest.middleware.security).toMatchInlineSnapshot(`
      {
        "authorizationStrategy": {
          "type": "OWNERSHIP_BASED",
        },
        "clientId": "clientId1",
      }
    `);
  });

  it('returns no FrontEndResponse for call 1', () => {
    expect(resultChain1.frontendResponse).toBeNull();
  });

  it('returns the given request for call 2', () => {
    expect(resultChain2.frontendRequest).toBe(frontendRequest2);
  });

  it('returns a FrontEndRequest with client information added for call 2', () => {
    expect(resultChain2.frontendRequest.middleware.security).toMatchInlineSnapshot(`
      {
        "authorizationStrategy": {
          "type": "OWNERSHIP_BASED",
        },
        "clientId": "clientId2",
      }
    `);
  });

  it('returns no FrontEndResponse for call 2', () => {
    expect(resultChain2.frontendResponse).toBeNull();
  });
});

describe('given two calls for verification with the same client id', () => {
  const frontendRequest1: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  const frontendRequest2: FrontendRequest = {
    ...newFrontendRequest(),
    headers: {
      Authorization: 'bearer 123456',
    },
  };

  let resultChain1: MiddlewareModel;
  let resultChain2: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();
    jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      );

    jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () =>
        Promise.resolve({
          ...newAxiosResponse(),
          status: 200,
          data: { active: true, roles: ['vendor'], client_id: 'clientId' },
        }),
      )
      .mockImplementationOnce(async () =>
        Promise.resolve({
          ...newAxiosResponse(),
          status: 200,
          data: { active: true, roles: ['vendor'], client_id: 'clientId' },
        }),
      );

    // Act
    resultChain1 = await authorize({ frontendRequest: frontendRequest1, frontendResponse: null });
    resultChain2 = await authorize({ frontendRequest: frontendRequest2, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    clearCaches();
  });

  it('returns the given request for call 1', () => {
    expect(resultChain1.frontendRequest).toBe(frontendRequest1);
  });

  it('returns a FrontEndRequest with client information added for call 1', () => {
    expect(resultChain1.frontendRequest.middleware.security).toMatchInlineSnapshot(`
      {
        "authorizationStrategy": {
          "type": "OWNERSHIP_BASED",
        },
        "clientId": "clientId",
      }
    `);
  });

  it('returns no FrontEndResponse for call 1', () => {
    expect(resultChain1.frontendResponse).toBeNull();
  });

  it('returns the given request for call 2', () => {
    expect(resultChain2.frontendRequest).toBe(frontendRequest2);
  });

  it('returns a FrontEndRequest with client information added for call 2', () => {
    expect(resultChain2.frontendRequest.middleware.security).toMatchInlineSnapshot(`
      {
        "authorizationStrategy": {
          "type": "OWNERSHIP_BASED",
        },
        "clientId": "clientId",
      }
    `);
  });

  it('returns no FrontEndResponse for call 2', () => {
    expect(resultChain2.frontendResponse).toBeNull();
  });
});

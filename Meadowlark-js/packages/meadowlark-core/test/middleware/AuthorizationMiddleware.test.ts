// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { authorize } from '../../src/middleware/AuthorizationMiddleware';
import * as OAuthFetch from '../../src/middleware/OAuthFetch';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest, newFrontendRequestMiddleware } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

jest.setTimeout(40000);

const newAxiosResponse = () => ({ status: 0, data: {}, headers: {}, config: {}, statusText: '' });

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    mockFetchOwnAccessToken = jest.spyOn(OAuthFetch, 'fetchOwnAccessToken');
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
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
        authorizationStrategy: { type: 'OWNERSHIP_BASED', withAssessment: false },
        clientId: 'clientId',
      },
      validateResources: true,
    },
  };
  let resultChain: MiddlewareModel;

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    mockFetchOwnAccessToken = jest.spyOn(OAuthFetch, 'fetchOwnAccessToken');
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
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
    mockFetchOwnAccessToken = jest.spyOn(OAuthFetch, 'fetchOwnAccessToken');
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 400 response with invalid authorization header', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(400);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`"{ message: "Invalid authorization header" }"`);
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
    mockFetchOwnAccessToken = jest.spyOn(OAuthFetch, 'fetchOwnAccessToken');
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 400 response with invalid authorization header', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(400);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(`"{ message: "Invalid authorization header" }"`);
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

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    mockFetchOwnAccessToken = jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 }));
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to OAuth server 401', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(
      `"{"message":"Request from Meadowlark to OAuth server failed"}"`,
    );
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

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    mockFetchOwnAccessToken = jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 404 }));
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to OAuth server 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(
      `"{"message":"Request from Meadowlark to OAuth server failed"}"`,
    );
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

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    mockFetchOwnAccessToken = jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 500 }));
    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to OAuth server 500', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(
      `"{"message":"Request from Meadowlark to OAuth server failed"}"`,
    );
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

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    mockFetchOwnAccessToken = jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () => Promise.reject(new Error()));

    mockFetchClientTokenVerification = jest.spyOn(OAuthFetch, 'fetchClientTokenVerification');

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to exception', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(
      `"{"message":"Request from Meadowlark to OAuth server failed"}"`,
    );
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

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    mockFetchOwnAccessToken = jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      )
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 500 })); // OAuth server crash on own token refresh

    mockFetchClientTokenVerification = jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 })); // own token no longer valid

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 502 response due to OAuth server 500 on own token refresh', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(502);
    expect(resultChain.frontendResponse?.body).toMatchInlineSnapshot(
      `"{"message":"Request from Meadowlark to OAuth server failed"}"`,
    );
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

  let mockFetchOwnAccessToken: any;
  let mockFetchClientTokenVerification: any;

  beforeAll(async () => {
    mockFetchOwnAccessToken = jest
      .spyOn(OAuthFetch, 'fetchOwnAccessToken')
      .mockImplementationOnce(async () =>
        Promise.resolve({ ...newAxiosResponse(), status: 200, data: { access_token: 'own_token' } }),
      )
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 })); // own token refresh, still not valid

    mockFetchClientTokenVerification = jest
      .spyOn(OAuthFetch, 'fetchClientTokenVerification')
      .mockImplementationOnce(async () => Promise.resolve({ ...newAxiosResponse(), status: 401 })); // own token no longer valid

    // Act
    resultChain = await authorize({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockFetchOwnAccessToken.mockRestore();
    mockFetchClientTokenVerification.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a 500 response due to OAuth server 401 on own token refresh', () => {
    expect(resultChain.frontendResponse?.statusCode).toBe(500);
    expect(resultChain.frontendResponse?.body).toEqual('');
  });
});

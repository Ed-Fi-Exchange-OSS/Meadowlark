// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import TTLCache from '@isaacs/ttlcache';
import axios, { AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { isDebugEnabled, Logger } from '@edfi/meadowlark-utilities';
import { FrontendRequest } from '../handler/FrontendRequest';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { Security } from '../security/Security';
import { FrontendResponse } from '../handler/FrontendResponse';
import { determineAuthStrategyFromRoles } from './ParseUserRole';

// Add default retry to Axios - 3 times, network errors or idempotent 500s
axiosRetry(axios);

const moduleName = 'AuthorizationMiddleware';

type VerifiedClientInfo = { security: Security; validateResources: boolean };
type RequestOwnAccessTokenResult =
  | { response: 'SUCCESS'; token: string }
  | { response: 'FAILURE_UNKNOWN' }
  | { response: 'FAILURE_NOT_EXISTS' }
  | { response: 'FAILURE_NOT_AUTHORIZED' };

const OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH = 'meadowlark_verify-only_key_1';
const OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH = 'meadowlark_verify-only_secret_1';
const OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST = 'http://localhost:3000/local/oauth/token';
const OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION = 'http://localhost:3000/local/oauth/verify';

let ownAccessTokenForClientAuth: string | null = null;

// TODO: extract max, ttl values to configuration
const cachedTokensForClients: TTLCache<string, VerifiedClientInfo> = new TTLCache({ ttl: 1000 * 60 * 5, max: 1000 });

function extractClientBearerTokenFrom(frontendRequest: FrontendRequest): string | undefined {
  const authorizationHeader: string | undefined =
    frontendRequest.headers.authorization ?? frontendRequest.headers.Authorization;
  if (authorizationHeader == null) return undefined;
  if (!authorizationHeader.toLowerCase().startsWith('bearer ')) return undefined;
  return authorizationHeader.substring(6);
}

async function requestOwnAccessToken(traceId: string): Promise<RequestOwnAccessTokenResult> {
  try {
    const response: AxiosResponse = await axios.post(
      OAUTH_SERVER_ENDPOINT_FOR_OWN_TOKEN_REQUEST,
      {
        grant_type: 'client_credentials',
        client_id: OWN_OAUTH_CLIENT_ID_FOR_CLIENT_AUTH,
        client_secret: OWN_OAUTH_CLIENT_SECRET_FOR_CLIENT_AUTH,
      },
      {
        headers: { 'content-type': 'application/json' },
        validateStatus: () => true,
      },
    );

    if (response.status === 200) {
      return { response: 'SUCCESS', token: response.data.access_token };
    }

    if (response.status === 401) {
      return { response: 'FAILURE_NOT_AUTHORIZED' };
    }

    if (response.status === 404) {
      return { response: 'FAILURE_NOT_EXISTS' };
    }
  } catch (e) {
    Logger.error(`${moduleName}.requestOwnAccessToken`, traceId, e);
  }
  return { response: 'FAILURE_UNKNOWN' };
}

/**
 * Handles authorization
 */
export async function authorize({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };

  writeRequestToLog(moduleName, frontendRequest, 'authorize');

  const clientBearerToken: string | undefined = extractClientBearerTokenFrom(frontendRequest);
  if (clientBearerToken == null) {
    const statusCode = 400;
    writeDebugStatusToLog(moduleName, frontendRequest, 'authorize', statusCode);
    return {
      frontendRequest,
      frontendResponse: {
        body: '{ message: "Invalid authorization header" }',
        statusCode,
        headers: frontendRequest.middleware.headerMetadata,
      },
    };
  }

  const cachedClientToken: VerifiedClientInfo | undefined = cachedTokensForClients.get(clientBearerToken);

  if (cachedClientToken != null) {
    if (isDebugEnabled()) {
      Logger.debug(
        `${moduleName}.authorize Found ${clientBearerToken} in cache with remaining TTL ${cachedTokensForClients.getRemainingTTL(
          clientBearerToken,
        )}`,
        frontendRequest.traceId,
      );
    }
    frontendRequest.middleware.security = { ...cachedClientToken.security };
    frontendRequest.middleware.validateResources = cachedClientToken.validateResources;
    return { frontendRequest, frontendResponse: null };
  }

  if (ownAccessTokenForClientAuth == null) {
    Logger.debug(`${moduleName}.authorize Requesting access token from OAuth server`, frontendRequest.traceId);
    const result: RequestOwnAccessTokenResult = await requestOwnAccessToken(frontendRequest.traceId);
    if (result.response === 'SUCCESS') {
      ownAccessTokenForClientAuth = result.token;
    } else {
      // TODO: More accurate "request access token for verification" failure indication
      const errorResponse: FrontendResponse = { body: '', statusCode: 502 };
      return { frontendRequest, frontendResponse: errorResponse };
    }
  }

  try {
    const verificationResponse: AxiosResponse = await axios.post(
      OAUTH_SERVER_ENDPOINT_FOR_TOKEN_VERIFICATION,
      `token=${clientBearerToken}`,
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `bearer ${ownAccessTokenForClientAuth}`,
        },
        validateStatus: (status: number) => status < 500,
      },
    );

    if (verificationResponse.status === 401) {
      // TODO: do requestOwnAccessToken and try one more time before giving up with 500 - not configured correctly
    }

    if (verificationResponse.status === 400) {
      // Client-provided token is not a JWT
      const errorResponse: FrontendResponse = { body: '', statusCode: 401 };
      return { frontendRequest, frontendResponse: errorResponse };
    }

    if (verificationResponse.status === 200) {
      if (!verificationResponse.data?.isValid || !verificationResponse.data?.introspectedToken?.active) {
        // Client token was a JWT, but invalid/inactive for some reason
        const errorResponse: FrontendResponse = { body: '', statusCode: 401 };
        return { frontendRequest, frontendResponse: errorResponse };
      }

      const roles: string[] = verificationResponse.data?.introspectedToken?.roles || [];
      const clientInfo: VerifiedClientInfo = {
        security: {
          clientId: verificationResponse.data?.introspectedToken?.client_id ?? 'UNKNOWN',
          authorizationStrategy: determineAuthStrategyFromRoles(roles),
        },
        validateResources: !roles.includes('assessment'),
      };

      cachedTokensForClients.set(clientBearerToken, clientInfo);
    }
  } catch (e) {
    // TODO: More accurate "verify client access token" failure indication
    const errorResponse: FrontendResponse = { body: '', statusCode: 502 };
    return { frontendRequest, frontendResponse: errorResponse };
  }

  const errorResponse: FrontendResponse = { body: '', statusCode: 502 };
  return { frontendRequest, frontendResponse: errorResponse };
}

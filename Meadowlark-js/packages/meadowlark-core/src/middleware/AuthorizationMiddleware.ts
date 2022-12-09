// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import TTLCache from '@isaacs/ttlcache';
import { AxiosResponse } from 'axios';
import { isDebugEnabled, writeErrorToLog } from '@edfi/meadowlark-utilities';
import { FrontendRequest } from '../handler/FrontendRequest';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { MiddlewareModel } from './MiddlewareModel';
import { Security, UndefinedSecurity } from '../security/Security';
import { FrontendResponse } from '../handler/FrontendResponse';
import { determineAuthStrategyFromRoles } from './ParseUserRole';
import { fetchOwnAccessToken, fetchClientTokenVerification } from './OAuthFetch';

const moduleName = 'core.middleware.AuthorizationMiddleware';

const OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL: number = process.env.OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL
  ? parseInt(process.env.OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL, 10)
  : 1000 * 60 * 5;
const OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES: number = process.env.OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES
  ? parseInt(process.env.OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES, 10)
  : 1000;

// Cache of own access token used for client token validation
let cachedOwnAccessTokenForClientAuth: string | null = null;

// Info from a client token, after being parsed by the configured OAuth server
type ClientTokenInfo = { security: Security; validateResources: boolean };

// Client token info cache, automatically evicts after TTL expires
const cachedClientsTokenInfo: TTLCache<string, ClientTokenInfo> = new TTLCache({
  ttl: OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_TTL,
  max: OAUTH_CLIENT_PROVIDED_TOKEN_CACHE_MAX_ENTRIES,
});

// For testing
export function clearCaches() {
  cachedOwnAccessTokenForClientAuth = null;
  cachedClientsTokenInfo.clear();
}

/**
 * Extracts the bearer token from an authorization header in the front end request, or returns undefined if not found
 */
function extractClientBearerTokenFrom(frontendRequest: FrontendRequest): string | undefined {
  const authorizationHeader: string | undefined =
    frontendRequest.headers.authorization ?? frontendRequest.headers.Authorization;
  if (authorizationHeader == null) return undefined;
  if (!authorizationHeader.toLowerCase().startsWith('bearer ')) return undefined;
  return authorizationHeader.substring(7);
}

type RequestOwnAccessTokenResult = { success: true; token: string } | { success: false; errorResponse: FrontendResponse };

/**
 * Fetches Meadowlark's own access token from the OAuth server and either returns the valid token
 * or a FrontEndResponse with an error.
 */
async function requestOwnAccessToken(frontendRequest: FrontendRequest): Promise<RequestOwnAccessTokenResult> {
  writeDebugStatusToLog(moduleName, frontendRequest, 'requestOwnAccessToken');

  try {
    // Request a token for Meadowlark using configured OAuth server and configured Meadowlark credentials
    const ownAccessTokenResponse: AxiosResponse = await fetchOwnAccessToken();
    if (ownAccessTokenResponse.status === 200) {
      // Cache the new Meadowlark token
      return { success: true, token: ownAccessTokenResponse.data.access_token };
    }

    if (ownAccessTokenResponse.status === 401 || ownAccessTokenResponse.status === 404) {
      writeErrorToLog(moduleName, frontendRequest.traceId, 'requestOwnAccessToken', 500, {
        message: 'OAuth server responded that configuration of Meadowlark client_id or client_secret is not valid',
      });

      return {
        success: false,
        errorResponse: {
          body: JSON.stringify({ message: 'Invalid Meadowlark to OAuth server configuration' }),
          statusCode: 500,
        },
      };
    }
    writeErrorToLog(moduleName, frontendRequest.traceId, 'requestOwnAccessToken', 500, {
      message: `OAuth server responded with unexpected status code ${ownAccessTokenResponse.status} on Meadowlark own token request`,
    });
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'requestOwnAccessToken', 500, e);
  }

  return {
    success: false,
    errorResponse: {
      body: JSON.stringify({ message: 'Request from Meadowlark to OAuth server failed' }),
      statusCode: 502,
    },
  };
}

/**
 * Middleware entrypoint to handle authorization of client requests. Verifies the client-provided access token
 * with the configured OAuth server. This process requires Meadowlark to have its own valid access token on
 * the OAuth server to be allowed to perform client token verification.
 */
export async function authorize({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };

  // if upstream has already provided security information, we are done
  if (frontendRequest.middleware.security !== UndefinedSecurity) {
    writeDebugStatusToLog(
      moduleName,
      frontendRequest,
      'authorize',
      undefined,
      'credentials provided upstream, skipping OAuth server requests',
    );
    return { frontendRequest, frontendResponse };
  }

  writeRequestToLog(moduleName, frontendRequest, 'authorize');

  // Extract the JWT token sent by the client
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

  // See if we've authenticated client token recently - within last TTL timeframe
  const cachedClientTokenInfo: ClientTokenInfo | undefined = cachedClientsTokenInfo.get(clientBearerToken);

  if (cachedClientTokenInfo != null) {
    if (isDebugEnabled()) {
      writeDebugStatusToLog(
        moduleName,
        frontendRequest,
        'authorize',
        undefined,
        `Client token authorized. Found ${clientBearerToken} in cache with remaining TTL ${cachedClientsTokenInfo.getRemainingTTL(
          clientBearerToken,
        )}`,
      );
    }
    frontendRequest.middleware.security = { ...cachedClientTokenInfo.security };
    frontendRequest.middleware.validateResources = cachedClientTokenInfo.validateResources;
    return { frontendRequest, frontendResponse: null };
  }

  // Check cache for Meadowlark's own access token
  if (cachedOwnAccessTokenForClientAuth == null) {
    // Not in cache, so fetch a new Meadowlark own access token
    const fetchOwnAccessTokenResult: RequestOwnAccessTokenResult = await requestOwnAccessToken(frontendRequest);

    if (fetchOwnAccessTokenResult.success) {
      // Cache the new Meadowlark token
      cachedOwnAccessTokenForClientAuth = fetchOwnAccessTokenResult.token;
    } else {
      return { frontendRequest, frontendResponse: fetchOwnAccessTokenResult.errorResponse };
    }
  }

  try {
    // Request validation of client-provided token from configured OAuth server
    let verificationResponse: AxiosResponse = await fetchClientTokenVerification(
      clientBearerToken,
      cachedOwnAccessTokenForClientAuth,
    );

    if (verificationResponse.status === 401) {
      // Meadowlark own token is no longer valid -- most likely expired
      writeDebugStatusToLog(
        moduleName,
        frontendRequest,
        'authorize',
        undefined,
        `OAuth server responded that Meadowlark own token is not valid`,
      );

      // Re-fetch Meadowlark own token - in case it expired - and try one more time
      const fetchOwnAccessTokenResult: RequestOwnAccessTokenResult = await requestOwnAccessToken(frontendRequest);

      if (fetchOwnAccessTokenResult.success) {
        // Cache the new Meadowlark token
        cachedOwnAccessTokenForClientAuth = fetchOwnAccessTokenResult.token;
      } else {
        return { frontendRequest, frontendResponse: fetchOwnAccessTokenResult.errorResponse };
      }

      // Second try at validation of client-provided token from configured OAuth server
      verificationResponse = await fetchClientTokenVerification(clientBearerToken, cachedOwnAccessTokenForClientAuth);
    }

    if (verificationResponse.status === 400) {
      // Client-provided token is not a well-formed JWT
      writeDebugStatusToLog(
        moduleName,
        frontendRequest,
        'authorize',
        400,
        'verification response returned 400 - Client-provided token is not a JWT',
      );
      return { frontendRequest, frontendResponse: { body: '', statusCode: 401 } };
    }

    if (verificationResponse.status === 200) {
      if (!verificationResponse.data?.active) {
        // Client-provided token accepted by OAuth server but not active
        writeDebugStatusToLog(moduleName, frontendRequest, 'authorize', 401, 'Client-provided token is inactive');
        return { frontendRequest, frontendResponse: { body: '', statusCode: 401 } };
      }

      // Return client id and Meadowlark authorization strategy (via roles in JWT) to middleware stack
      const roles: string[] = verificationResponse.data?.roles || [];
      const clientTokenInfo: ClientTokenInfo = {
        security: {
          clientId: verificationResponse.data?.client_id ?? 'UNKNOWN',
          authorizationStrategy: determineAuthStrategyFromRoles(roles),
        },
        validateResources: !roles.includes('assessment'),
      };

      cachedClientsTokenInfo.set(clientBearerToken, clientTokenInfo);

      frontendRequest.middleware.security = { ...clientTokenInfo.security };
      frontendRequest.middleware.validateResources = clientTokenInfo.validateResources;
      return { frontendRequest, frontendResponse: null };
    }

    // Unexpected http status returned by OAuth server. Nothing Meadowlark can do about it.
    writeErrorToLog(
      moduleName,
      frontendRequest.traceId,
      'authorize',
      502,
      `verification response returned ${verificationResponse.status} unexpectedly`,
    );
    return { frontendRequest, frontendResponse: { body: '', statusCode: 502 } };
  } catch (e) {
    // Unexpected failure communicating with OAuth server
    writeErrorToLog(moduleName, frontendRequest.traceId, 'authorize', 500, e);
    return { frontendRequest, frontendResponse: { body: '', statusCode: 500 } };
  }
}

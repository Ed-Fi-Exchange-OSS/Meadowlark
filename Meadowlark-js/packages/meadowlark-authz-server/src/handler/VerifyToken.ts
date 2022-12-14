// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import querystring from 'node:querystring';
import { Logger } from '@edfi/meadowlark-utilities';
import type { AuthorizationResponse } from './AuthorizationResponse';
import { AuthorizationRequest, extractAuthorizationHeader } from './AuthorizationRequest';
import type { VerifyTokenBody } from '../model/VerifyTokenBody';
import { BodyValidation, validateVerifyTokenBody } from '../validation/BodyValidation';
import { ensurePluginsLoaded } from '../plugin/AuthorizationPluginLoader';
import {
  hasAdminOrVerifyOnlyRole,
  introspectBearerToken,
  validateTokenForAccess,
  ValidateTokenResult,
} from '../security/TokenValidator';
import { IntrospectionResponse } from '../model/TokenResponse';

const moduleName = 'authz.handler.VerifyToken';

type ParsedVerifyTokenBody =
  | { isValid: true; verifyTokenBody: VerifyTokenBody }
  | { isValid: false; failureMessage: object | string };

/**
 * Parses the request which is form url-encoded with two tokens. One is the bearer token itself and the
 * other is the token for verification/introspection.
 *
 * This function returns the request elements as an object, or a failure message if the request
 * is not valid.
 */
function parseVerifyTokenBody(authorizationRequest: AuthorizationRequest): ParsedVerifyTokenBody {
  if (authorizationRequest.body == null) return { isValid: false, failureMessage: 'Request body is empty' };

  let unvalidatedBody: any;

  // startsWith accounts for possibility of the content-type being with or without encoding
  if (!authorizationRequest.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
    const error = 'Requires application/x-www-form-urlencoded content type';
    Logger.debug(`${moduleName}.parseVerifyTokenBody: ${error}`, authorizationRequest.traceId);
    return { isValid: false, failureMessage: error };
  }

  try {
    unvalidatedBody = querystring.parse(authorizationRequest.body);
  } catch (e) {
    const error = `Malformed body: ${e.message}`;
    Logger.debug(`${moduleName}.parseRequestTokenBody: ${error}`, authorizationRequest.traceId);
    return { isValid: false, failureMessage: { error } };
  }

  const bodyValidation: BodyValidation = validateVerifyTokenBody(unvalidatedBody);
  if (!bodyValidation.isValid) {
    Logger.debug(`${moduleName}.parseRequestTokenBody: ${bodyValidation.failureMessage}`, authorizationRequest.traceId);
    return { isValid: false, failureMessage: bodyValidation.failureMessage };
  }

  const validatedBody: VerifyTokenBody = unvalidatedBody as VerifyTokenBody;

  return { isValid: true, verifyTokenBody: validatedBody };
}

/*
 * Endpoint that verifies a token
 */
export async function verifyToken(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  try {
    Logger.info(`${moduleName}.verifyToken`, authorizationRequest.traceId);
    await ensurePluginsLoaded();

    // Get the client id and roles for the requester
    const requesterTokenResult: ValidateTokenResult = validateTokenForAccess(
      extractAuthorizationHeader(authorizationRequest),
      authorizationRequest.traceId,
    );

    if (!requesterTokenResult.isValid) {
      return {
        statusCode: 401,
        body: requesterTokenResult.errorResponse.body,
      };
    }

    // Get the token to be introspected
    const parsedRequest: ParsedVerifyTokenBody = parseVerifyTokenBody(authorizationRequest);
    if (!parsedRequest.isValid) {
      Logger.debug(`${moduleName}.verifyToken: 400`, authorizationRequest.traceId, parsedRequest.failureMessage);
      return {
        body: { error: parsedRequest.failureMessage },
        statusCode: 400,
      };
    }

    // Introspect
    const introspectionResponse: IntrospectionResponse = await introspectBearerToken(
      parsedRequest.verifyTokenBody.token,
      authorizationRequest.traceId,
    );

    if (!introspectionResponse.isValid) {
      const message = 'Invalid token provided for introspection';
      Logger.debug(`${moduleName}.verifyToken: 400`, authorizationRequest.traceId, message);
      return {
        body: { error: message },
        statusCode: 400,
      };
    }

    const { introspectedToken } = introspectionResponse;

    // Ensure authorization for introspection result - either requester has same client id, is admin, or is verify
    if (
      requesterTokenResult.clientId !== introspectedToken.client_id &&
      !hasAdminOrVerifyOnlyRole(requesterTokenResult.roles)
    ) {
      Logger.debug(`${moduleName}.verifyToken: 401`, authorizationRequest.traceId);
      return { statusCode: 401 };
    }

    Logger.debug(`${moduleName}.verifyToken: 200`, authorizationRequest.traceId);
    return {
      body: introspectedToken,
      statusCode: 200,
    };
  } catch (e) {
    Logger.error(`${moduleName}.verifyToken: 500`, authorizationRequest.traceId, e);
    return { statusCode: 500 };
  }
}

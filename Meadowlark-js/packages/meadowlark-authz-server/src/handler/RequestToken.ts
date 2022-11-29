// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import querystring from 'node:querystring';
import { create as createJwt } from 'njwt';
import { Logger } from '@edfi/meadowlark-utilities';
import { signingKey } from '../model/SigningKey';
import { admin1, verifyOnly1 } from '../security/HardcodedCredential';
import type { Jwt } from '../security/Jwt';
import type { AuthorizationResponse } from './AuthorizationResponse';
import { AuthorizationRequest, extractAuthorizationHeader } from './AuthorizationRequest';
import type { RequestTokenBody } from '../model/RequestTokenBody';
import { BodyValidation, validateRequestTokenBody } from '../validation/BodyValidation';
import type { GetAuthorizationClientResult } from '../message/GetAuthorizationClientResult';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { hashClientSecretHexString } from '../security/HashClientSecret';
import { getTokenExpiration, getTokenIssuer } from '../security/TokenSettings';

const moduleName = 'RequestToken';

type ParsedRequestTokenBody =
  | { isValid: true; requestTokenBody: RequestTokenBody }
  | { isValid: false; failureMessage: string };

/*
 * Creates a standard Meadowlark Jwt.
 */
function createToken(clientId: string, vendor: string, roles: string[]): Jwt {
  const issuer = getTokenIssuer();
  const claims = { iss: issuer, aud: issuer, roles, client_id: clientId };

  const token: Jwt = createJwt({ ...claims, sub: vendor }, signingKey()) as Jwt;

  token.setExpiration(new Date().getTime() + getTokenExpiration() * 60 * 1000);
  return token;
}

function tokenResponseFrom(token: Jwt): string {
  return JSON.stringify({
    access_token: token.compact(),
    token_type: 'bearer',
    expires_in: token.body.exp,
    refresh_token: 'not available',
  });
}

function maskClientSecret(body: RequestTokenBody): string {
  const masked = body.client_secret != null ? `${body.client_secret.slice(body.client_secret.length - 4)}` : '';
  return `grant_type: ${body.grant_type || ''}, client_id: ${body.client_id || ''}, client_secret: ****${masked}`;
}

/**
 * Parses the request which can take several forms. The body can either be JSON or form url-encoded, and the client id
 * and client secret can either be part of the body or encoded in the header.
 *
 * Regardless of form, this function returns the request elements as an object, or a failure message if the request
 * is not valid.
 */
function parseRequestTokenBody(authorizationRequest: AuthorizationRequest): ParsedRequestTokenBody {
  if (authorizationRequest.body == null) return { isValid: false, failureMessage: 'Request body is empty' };

  let unvalidatedBody: any;

  // startsWith accounts for possibility of the content-type being with or without encoding
  if (authorizationRequest.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
    try {
      unvalidatedBody = querystring.parse(authorizationRequest.body);
    } catch (error) {
      Logger.debug(`${moduleName}.parseRequestTokenBody: Malformed body - ${error.message}`, authorizationRequest.traceId);
      return { isValid: false, failureMessage: `Malformed body: ${error.message}` };
    }
  } else {
    try {
      unvalidatedBody = JSON.parse(authorizationRequest.body);
    } catch (error) {
      Logger.debug(`${moduleName}.parseRequestTokenBody: Malformed body - ${error.message}`, authorizationRequest.traceId);
      return { isValid: false, failureMessage: `Malformed body: ${error.message}` };
    }
  }

  const bodyValidation: BodyValidation = validateRequestTokenBody(unvalidatedBody);
  if (!bodyValidation.isValid) {
    Logger.debug(`${moduleName}.parseRequestTokenBody: Invalid request body`, authorizationRequest.traceId);
    return { isValid: false, failureMessage: bodyValidation.failureMessage };
  }

  const validatedBody: RequestTokenBody = unvalidatedBody as RequestTokenBody;

  // client_id and client_secret can either be directly in the payload or encoded as an Authorization header.
  // Validation ensures that if one is in the body then both are.
  if (validatedBody.client_id != null) {
    return { isValid: true, requestTokenBody: validatedBody };
  }

  const authorizationHeader: string | undefined = extractAuthorizationHeader(authorizationRequest);

  if (authorizationHeader == null) {
    Logger.debug(`${moduleName}.parseRequestTokenBody: Missing authorization header`, authorizationRequest.traceId);
    return { isValid: false, failureMessage: 'Missing authorization header' };
  }

  if (!authorizationHeader.startsWith('Basic ')) {
    Logger.debug(`${moduleName}.parseRequestTokenBody: Invalid authorization header`, authorizationRequest.traceId);
    return { isValid: false, failureMessage: 'Invalid authorization header' };
  }

  // Extract from "Basic <encoded>" where encoded is the Base64 form of "client_id:client_secret"
  const split = Buffer.from(authorizationHeader.slice(6), 'base64').toString('binary').split(':');
  if (split.length !== 2) {
    Logger.debug(`${moduleName}.parseRequestTokenBody: Invalid authorization header`, authorizationRequest.traceId);
    return { isValid: false, failureMessage: 'Invalid authorization header' };
  }

  [validatedBody.client_id, validatedBody.client_secret] = split;

  return { isValid: true, requestTokenBody: validatedBody };
}

/*
 * Endpoint that generates a JWT.
 */
export async function requestToken(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  try {
    Logger.info(`${moduleName}.requestToken`, authorizationRequest.traceId);
    await ensurePluginsLoaded();

    const parsedRequest: ParsedRequestTokenBody = parseRequestTokenBody(authorizationRequest);
    if (!parsedRequest.isValid) {
      return {
        body: JSON.stringify({ error: parsedRequest.failureMessage }),
        statusCode: 400,
      };
    }

    const { requestTokenBody } = parsedRequest;

    Logger.debug(`${moduleName}.requestToken ${maskClientSecret(requestTokenBody)}`, authorizationRequest.traceId);

    if (requestTokenBody.grant_type === 'client_credentials') {
      // Check hardcoded credentials first
      const { client_id: clientId, client_secret: clientSecret } = requestTokenBody;

      if (clientId === admin1.key && clientSecret === admin1.secret) {
        Logger.debug(`${moduleName}.requestToken: 200 - Hardcoded admin1`, authorizationRequest.traceId);
        return {
          body: tokenResponseFrom(createToken(admin1.key, admin1.vendor, admin1.role)),
          statusCode: 200,
        };
      }
      if (clientId === verifyOnly1.key && clientSecret === verifyOnly1.secret) {
        Logger.debug(`${moduleName}.requestToken: 200 - Hardcoded verifyOnly1`, authorizationRequest.traceId);
        return {
          body: tokenResponseFrom(createToken(verifyOnly1.key, verifyOnly1.vendor, verifyOnly1.role)),
          statusCode: 200,
        };
      }

      // Go to authentication datastore
      const result: GetAuthorizationClientResult = await getAuthorizationStore().getAuthorizationClient({
        clientId,
        traceId: authorizationRequest.traceId,
      });

      if (result.response === 'UNKNOWN_FAILURE') {
        Logger.debug(`${moduleName}.requestToken: ${maskClientSecret(requestTokenBody)} 500`, authorizationRequest.traceId);
        return { body: '', statusCode: 500 };
      }

      if (result.response === 'GET_FAILURE_NOT_EXISTS') {
        Logger.debug(`${moduleName}.requestToken: ${maskClientSecret(requestTokenBody)} 404`, authorizationRequest.traceId);
        return { body: '', statusCode: 404 };
      }

      if (!result.active) {
        Logger.debug(
          `${moduleName}.requestToken: ${maskClientSecret(requestTokenBody)} Client deactivated `,
          authorizationRequest.traceId,
        );
        return { body: '', statusCode: 403 };
      }

      if (hashClientSecretHexString(requestTokenBody.client_secret) !== result.clientSecretHashed) {
        Logger.debug(`${moduleName}.requestToken: ${maskClientSecret(requestTokenBody)} 401`, authorizationRequest.traceId);
        return { body: '', statusCode: 401 };
      }

      Logger.debug(`${moduleName}.requestToken: ${maskClientSecret(requestTokenBody)} 200`, authorizationRequest.traceId);

      return {
        body: tokenResponseFrom(createToken(clientId, result.clientName, result.roles)),
        statusCode: 200,
      };
    }

    return { body: '', statusCode: 401 };
  } catch (e) {
    Logger.debug(`${moduleName}.requestToken: 500`, authorizationRequest.traceId, e);
    return { body: '', statusCode: 500 };
  }
}

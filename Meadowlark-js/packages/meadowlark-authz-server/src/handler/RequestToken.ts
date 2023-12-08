// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import querystring from 'node:querystring';
import { create as createJwt } from 'njwt';
import { Config } from '@edfi/meadowlark-utilities';
import { admin1, verifyOnly1 } from '../security/HardcodedCredential';
import type { Jwt } from '../security/Jwt';
import type { AuthorizationResponse } from './AuthorizationResponse';
import { AuthorizationRequest, extractAuthorizationHeader } from './AuthorizationRequest';
import type { RequestTokenBody } from '../model/RequestTokenBody';
import { BodyValidation, applySuggestions, validateRequestTokenBody } from '../validation/BodyValidation';
import type { GetAuthorizationClientResult } from '../message/GetAuthorizationClientResult';
import { ensurePluginsLoaded, getAuthorizationStore } from '../plugin/AuthorizationPluginLoader';
import { hashClientSecretHexString } from '../security/HashClientSecret';
import { TokenSuccessResponse } from '../model/TokenResponse';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';

const moduleName = 'authz.handler.RequestToken';

type ParsedRequestTokenBody =
  | { isValid: true; requestTokenBody: RequestTokenBody }
  | { isValid: false; failureMessage: object };

/*
 * Creates a standard Meadowlark Jwt.
 */
function createToken(clientId: string, vendor: string, roles: string[]): Jwt {
  const iss: string = Config.get('OAUTH_TOKEN_ISSUER');
  const aud: string = Config.get('OAUTH_TOKEN_AUDIENCE');
  const claims = { iss, aud, roles, client_id: clientId };

  const signingKey = Config.get('OAUTH_SIGNING_KEY');
  const token: Jwt = createJwt({ ...claims, sub: vendor }, signingKey) as Jwt;

  const expiresIn: number = Config.get('OAUTH_EXPIRATION_MINUTES');
  token.setExpiration(new Date().getTime() + expiresIn * 60 * 1000);
  return token;
}

function tokenResponseFrom(token: Jwt): TokenSuccessResponse {
  return {
    access_token: token.compact(),
    token_type: 'bearer',
    expires_in: token.body.exp,
    refresh_token: 'not available',
  };
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
  if (authorizationRequest.body == null) return { isValid: false, failureMessage: { message: 'Request body is empty' } };

  let parsedBody: any;

  // startsWith accounts for possibility of the content-type being with or without encoding
  if (authorizationRequest.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
    try {
      parsedBody = querystring.parse(authorizationRequest.body);
    } catch (error) {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'parseRequestTokenBody', 400, error.message);
      return { isValid: false, failureMessage: { message: `Malformed body: ${error.message}` } };
    }
  } else {
    try {
      parsedBody = JSON.parse(authorizationRequest.body);
    } catch (error) {
      writeDebugStatusToLog(moduleName, authorizationRequest, 'parseRequestTokenBody', 400, error.message);
      return { isValid: false, failureMessage: { message: `Malformed body: ${error.message}` } };
    }
  }

  let validation: BodyValidation = validateRequestTokenBody(parsedBody);
  // The validation will return suggestions for properties not found that have a similar match,
  // here will apply it and validate once more, if this does not pass validation will return failure with the error message.
  if (!validation.isValid && validation.suggestions) {
    writeDebugStatusToLog(
      moduleName,
      authorizationRequest,
      'parseRequestTokenBody',
      400,
      'Invalid request body, checking for suggestions',
    );
    parsedBody = applySuggestions(parsedBody, validation.suggestions);
    validation = validateRequestTokenBody(parsedBody);
  }

  if (!validation.isValid) {
    writeDebugStatusToLog(moduleName, authorizationRequest, 'parseRequestTokenBody', 400, 'Invalid request body');
    return { isValid: false, failureMessage: validation.failureMessage };
  }

  const requestTokenBody: RequestTokenBody = parsedBody as RequestTokenBody;

  // client_id and client_secret can either be directly in the payload or encoded as an Authorization header.
  // Validation ensures that if one is in the body then both are.
  if (requestTokenBody.client_id != null) {
    return { isValid: true, requestTokenBody };
  }

  const authorizationHeader: string | undefined = extractAuthorizationHeader(authorizationRequest);

  if (authorizationHeader == null) {
    const message = 'Missing authorization header';
    writeDebugStatusToLog(moduleName, authorizationRequest, 'parseRequestTokenBody', 400, message);
    return { isValid: false, failureMessage: { message } };
  }

  if (!authorizationHeader.startsWith('Basic ')) {
    const message = 'Invalid authorization header';
    writeDebugStatusToLog(moduleName, authorizationRequest, 'parseRequestTokenBody', 400, message);
    return { isValid: false, failureMessage: { message } };
  }

  // Extract from "Basic <encoded>" where encoded is the Base64 form of "client_id:client_secret"
  const split = Buffer.from(authorizationHeader.slice(6), 'base64').toString('binary').split(':');
  if (split.length !== 2) {
    const message = 'Invalid authorization header';
    writeDebugStatusToLog(moduleName, authorizationRequest, 'parseRequestTokenBody', 400, message);
    return { isValid: false, failureMessage: { message } };
  }

  [requestTokenBody.client_id, requestTokenBody.client_secret] = split;

  return { isValid: true, requestTokenBody };
}

/*
 * Endpoint that generates a JWT.
 */
export async function requestToken(authorizationRequest: AuthorizationRequest): Promise<AuthorizationResponse> {
  try {
    writeRequestToLog(moduleName, authorizationRequest, 'requestToken');
    await ensurePluginsLoaded();

    const parsedRequest: ParsedRequestTokenBody = parseRequestTokenBody(authorizationRequest);
    if (!parsedRequest.isValid) {
      return {
        body: { error: parsedRequest.failureMessage },
        statusCode: 400,
      };
    }

    const { requestTokenBody } = parsedRequest;

    writeDebugStatusToLog(moduleName, authorizationRequest, 'requestToken', 200);

    if (requestTokenBody.grant_type === 'client_credentials') {
      // Check hardcoded credentials first
      const { client_id: clientId, client_secret: clientSecret } = requestTokenBody;

      const enableHardCoded = Config.get('OAUTH_HARD_CODED_CREDENTIALS_ENABLED');

      if (!enableHardCoded && (clientId === admin1.key || clientId === verifyOnly1.key)) {
        writeDebugStatusToLog(moduleName, authorizationRequest, 'requestToken', 401);

        return { statusCode: 401 };
      }

      if (clientId === admin1.key && clientSecret === admin1.secret) {
        writeDebugStatusToLog(moduleName, authorizationRequest, 'requestToken', 200, 'Hardcoded admin1');
        return {
          body: tokenResponseFrom(createToken(admin1.key, admin1.vendor, admin1.role)),
          statusCode: 200,
        };
      }
      if (clientId === verifyOnly1.key && clientSecret === verifyOnly1.secret) {
        writeDebugStatusToLog(moduleName, authorizationRequest, 'requestToken', 200, 'Hardcoded verifyOnly1');
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
        writeDebugStatusToLog(moduleName, authorizationRequest, 'requestToken', 500);
        return { statusCode: 500 };
      }

      if (result.response === 'GET_FAILURE_NOT_EXISTS') {
        writeDebugStatusToLog(
          moduleName,
          authorizationRequest,
          'requestToken',
          401,
          `${maskClientSecret(requestTokenBody)} Client does not exist`,
        );
        return { statusCode: 401 };
      }

      if (!result.active) {
        writeDebugStatusToLog(
          moduleName,
          authorizationRequest,
          'requestToken',
          403,
          `${maskClientSecret(requestTokenBody)} Client deactivated`,
        );
        return { statusCode: 403 };
      }

      if (hashClientSecretHexString(requestTokenBody.client_secret) !== result.clientSecretHashed) {
        writeDebugStatusToLog(
          moduleName,
          authorizationRequest,
          'requestToken',
          401,
          `${maskClientSecret(requestTokenBody)} 401`,
        );
        return { statusCode: 401 };
      }

      writeDebugStatusToLog(moduleName, authorizationRequest, 'requestToken', 200);

      return {
        body: tokenResponseFrom(createToken(clientId, result.clientName, result.roles)),
        statusCode: 200,
      };
    }

    return { statusCode: 401 };
  } catch (e) {
    writeDebugStatusToLog(moduleName, authorizationRequest, 'requestToken', 500, e);
    return { statusCode: 500 };
  }
}

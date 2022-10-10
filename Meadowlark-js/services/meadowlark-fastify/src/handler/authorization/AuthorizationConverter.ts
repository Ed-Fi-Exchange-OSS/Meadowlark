// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// Disable no-floating-promises because Fastify has a multi-async style and we aren't using the one eslint is flagging
/* eslint-disable @typescript-eslint/no-floating-promises */

import { LOCATION_HEADER_NAME } from '@edfi/meadowlark-core';
import { newAuthorizationRequest } from '@edfi/meadowlark-authz-server';
import type { AuthorizationRequest, AuthorizationResponse } from '@edfi/meadowlark-authz-server';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { extractPath, MEADOWLARK_STAGE, getHeaders, CompatibleParameters } from '../FastifyUtility';

export function fromRequest(fastifyRequest: FastifyRequest): AuthorizationRequest {
  return {
    ...newAuthorizationRequest(),
    path: extractPath(fastifyRequest, MEADOWLARK_STAGE),
    traceId: fastifyRequest.id ?? '',
    body: fastifyRequest.body as string,
    headers: getHeaders(fastifyRequest),
    queryParameters: (fastifyRequest.query as CompatibleParameters) ?? {},
    stage: MEADOWLARK_STAGE,
  };
}

export function respondWith(authorizationResponse: AuthorizationResponse, fastifyReply: FastifyReply) {
  if (authorizationResponse.headers != null) {
    const locationHeader: string | undefined = authorizationResponse.headers[LOCATION_HEADER_NAME];
    if (locationHeader != null) {
      // Need to add the stage to the location header, url will be of form `/path/resource`
      authorizationResponse.headers[LOCATION_HEADER_NAME] = `/${MEADOWLARK_STAGE}${locationHeader}`;
    }
    fastifyReply.headers(authorizationResponse.headers);
  }
  fastifyReply.code(authorizationResponse.statusCode).send(authorizationResponse.body);
}

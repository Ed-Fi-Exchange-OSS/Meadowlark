// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// Disable no-floating-promises because Fastify has a multi-async style and we aren't using the one eslint is flagging
/* eslint-disable @typescript-eslint/no-floating-promises */
/* istanbul ignore file */
import { Config, LOCATION_HEADER_NAME } from '@edfi/meadowlark-utilities';
import { newFrontendRequest } from '@edfi/meadowlark-core';
import type { FrontendRequest, FrontendResponse, TraceId } from '@edfi/meadowlark-core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { extractPath, getHeaders, CompatibleParameters } from './FastifyUtility';

export function fromRequest(fastifyRequest: FastifyRequest): FrontendRequest {
  return {
    ...newFrontendRequest(),
    path: extractPath(fastifyRequest, Config.get('MEADOWLARK_STAGE')),
    traceId: (fastifyRequest.id ?? '') as TraceId,
    body: fastifyRequest.body as string,
    headers: getHeaders(fastifyRequest),
    queryParameters: (fastifyRequest.query as CompatibleParameters) ?? {},
    stage: Config.get('MEADOWLARK_STAGE'),
  };
}

export function respondWith(frontendResponse: FrontendResponse, fastifyReply: FastifyReply) {
  if (frontendResponse.headers != null) {
    const locationHeader: string | undefined = frontendResponse.headers[LOCATION_HEADER_NAME];
    if (locationHeader != null) {
      // Need to add the stage to the location header, url will be of form `/path/resource`
      frontendResponse.headers[LOCATION_HEADER_NAME] = `/${Config.get('MEADOWLARK_STAGE')}${locationHeader}`;
    }
    fastifyReply.headers(frontendResponse.headers);
  }
  fastifyReply.code(frontendResponse.statusCode).send(frontendResponse.body);
}

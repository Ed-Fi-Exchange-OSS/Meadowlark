// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, FrontendResponse, newFrontendRequest } from '@edfi/meadowlark-core';
import { FastifyReply, FastifyRequest } from 'fastify';

type CompatibleParameters = { [header: string]: string | undefined };

export function fromRequest(fastifyRequest: FastifyRequest): FrontendRequest {
  const params = (fastifyRequest.params as object)['*'] ?? '';
  const path = `/${params}`;

  return {
    ...newFrontendRequest(),
    path,
    traceId: fastifyRequest.id ?? '',
    body: fastifyRequest.body as string,
    headers: (fastifyRequest.headers as CompatibleParameters) ?? {},

    queryStringParameters: (fastifyRequest.query as CompatibleParameters) ?? {},
    stage: 'local',
  };
}

export function respondWith(frontendResponse: FrontendResponse, fastifyReply: FastifyReply) {
  if (frontendResponse.headers != null) {
    fastifyReply.headers(frontendResponse.headers);
  }
  fastifyReply.code(frontendResponse.statusCode).send(frontendResponse.body);
}

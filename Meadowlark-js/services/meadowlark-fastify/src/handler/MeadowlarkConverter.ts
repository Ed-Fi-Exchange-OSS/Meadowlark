// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest, FrontendResponse, newFrontendRequest, FrontendHeaders } from '@edfi/meadowlark-core';
import { FastifyReply, FastifyRequest } from 'fastify';

type CompatibleParameters = { [header: string]: string | undefined };

function getHeaders(fastifyRequest: FastifyRequest): FrontendHeaders {
  const headers = (fastifyRequest.headers as CompatibleParameters) ?? {};
  headers.Host = fastifyRequest.hostname;
  return headers;
}

function extractPath(fastifyRequest: FastifyRequest, stage: string): string {
  // If the routing in Fastify is defined with "/*" then we need to extract the desired path parameters from
  // `fastifyRequest.params` object. Otherwise, read the path from the URL.

  const params = (fastifyRequest.params as object)['*'] ?? '';
  const path = `/${params}`;

  if (path !== '/') {
    return path;
  }

  const { url } = fastifyRequest.context.config as any;
  // url will be of form `/{stage}/path/resource`. Need to remove the stage.
  return url.slice(stage.length + 1);
}

export function fromRequest(fastifyRequest: FastifyRequest): FrontendRequest {
  const stage = process.env.MEADOWLARK_STAGE || 'local';

  return {
    ...newFrontendRequest(),
    path: extractPath(fastifyRequest, stage),
    traceId: fastifyRequest.id ?? '',
    body: fastifyRequest.body as string,
    headers: getHeaders(fastifyRequest),
    queryStringParameters: (fastifyRequest.query as CompatibleParameters) ?? {},
    stage,
  };
}

export function respondWith(frontendResponse: FrontendResponse, fastifyReply: FastifyReply) {
  if (frontendResponse.headers != null) {
    fastifyReply.headers(frontendResponse.headers);
  }
  fastifyReply.code(frontendResponse.statusCode).send(frontendResponse.body);
}

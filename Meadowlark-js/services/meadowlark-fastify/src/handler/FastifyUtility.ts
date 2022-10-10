// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// Disable no-floating-promises because Fastify has a multi-async style and we aren't using the one eslint is flagging
/* eslint-disable @typescript-eslint/no-floating-promises */

import type { Headers } from '@edfi/meadowlark-core';
import type { FastifyRequest } from 'fastify';

export type CompatibleParameters = { [header: string]: string | undefined };

export const MEADOWLARK_STAGE = process.env.MEADOWLARK_STAGE || 'local';

export function getHeaders(fastifyRequest: FastifyRequest): Headers {
  const headers = (fastifyRequest.headers as CompatibleParameters) ?? {};
  headers.Host = fastifyRequest.hostname;
  return headers;
}

export function extractPath(fastifyRequest: FastifyRequest, stage: string): string {
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

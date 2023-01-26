// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// Disable no-floating-promises because Fastify has a multi-async style and we aren't using the one eslint is flagging
/* eslint-disable @typescript-eslint/no-floating-promises */

import nodeUrl from 'node:url';
import type { Headers } from '@edfi/meadowlark-core';
import type { FastifyRequest } from 'fastify';

export type CompatibleParameters = { [header: string]: string | undefined };

// Returns header names lowercased
export function getHeaders(fastifyRequest: FastifyRequest): Headers {
  const headers = (fastifyRequest.headers as CompatibleParameters) ?? {};
  headers.Host = fastifyRequest.hostname;

  // ensure all header names are lowercased
  return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
}

export function extractPath(fastifyRequest: FastifyRequest, stage: string): string {
  const url = nodeUrl.parse(fastifyRequest.raw.url ?? '').pathname ?? '';

  // url will be of form `/{stage}/path/resource`. Need to remove the stage.
  return url.slice(stage.length + 1);
}

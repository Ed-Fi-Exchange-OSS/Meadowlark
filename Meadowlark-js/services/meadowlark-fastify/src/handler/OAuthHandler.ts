// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as Meadowlark from '@edfi/meadowlark-core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { respondWith, fromRequest } from './MeadowlarkConverter';

export async function oauthHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await Meadowlark.oauthHandler(fromRequest(request)), reply);
}

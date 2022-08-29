// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { loadDescriptors as meadowlarkLoadDescriptors } from '@edfi/meadowlark-core';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * A trigger to call the loadDescriptors function via a Fastify endpoint.
 * Only available when the stage is explicitly set to "local".
 */
export async function loadDescriptors(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (process.env.MEADOWLARK_STAGE !== 'local') {
    await reply.code(404).send('');
    return;
  }
  await meadowlarkLoadDescriptors();
  await reply.code(202).send('');
}

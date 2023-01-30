// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FastifyInstance } from 'fastify';
import { Config, Logger } from '@edfi/meadowlark-utilities';
import { buildService } from './Service';

export type ServiceFactory = (worker: number) => Promise<void>;
/* istanbul ignore file */
export async function serviceFactory(worker: number) {
  const service: FastifyInstance = buildService();
  try {
    const address: string = await service.listen(Config.get('FASTIFY_PORT'), '0.0.0.0');
    Logger.info(`🚀 Starting Meadowlark API at ${address}/${Config.get('MEADOWLARK_STAGE')} for worker ${worker}`, null);
  } catch (err) {
    service.log.error(err);
    process.exit(1);
  }
}

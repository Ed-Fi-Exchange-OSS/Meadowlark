// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FastifyInstance } from 'fastify';
import { Logger } from '@edfi/meadowlark-utilities';
import { buildService } from './Service';

export type ServiceFactory = (worker: number) => Promise<void>;

export async function serviceFactory(worker: number) {
  const service: FastifyInstance = buildService();
  try {
    let port: number = 3000;
    if (process.env.FASTIFY_PORT != null) {
      const possiblePort: number = parseInt(process.env.FASTIFY_PORT, 10);

      if (!Number.isNaN(possiblePort)) port = possiblePort;
    }

    const stage = process.env.MEADOWLARK_STAGE ?? 'local';

    const address: string = await service.listen(port);
    Logger.info(`🚀 Starting Meadowlark API at ${address}/${stage} for worker ${worker}`, null);
  } catch (err) {
    service.log.error(err);
    process.exit(1);
  }
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// import { getLogger } from '@edfi/meadowlark-utilities';
// import winston from 'winston';
import { buildService } from '@edfi/meadowlark-fastify/src/Service';

let serverInstance;

export function getServer() {
  return serverInstance;
}

export async function setup() {
  // const logger = getLogger();
  // const consoleLogger = new winston.transports.Console();
  // logger.add(consoleLogger);

  serverInstance = buildService();
  try {
    let port: number = 3000;
    if (process.env.FASTIFY_PORT != null) {
      const possiblePort: number = parseInt(process.env.FASTIFY_PORT, 10);

      if (!Number.isNaN(possiblePort)) port = possiblePort;
    }

    process.env.MEADOWLARK_STAGE ?? 'local';

    await serverInstance.listen(port);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

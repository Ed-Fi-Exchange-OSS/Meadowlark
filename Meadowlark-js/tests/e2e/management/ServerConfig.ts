// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { buildService } from '@edfi/meadowlark-fastify/src/Service';
import { initializeLogging } from '@edfi/meadowlark-utilities';

let serverInstance;
let serverAlreadyRunning = false;

export function wasServerAlreadyRunning(): boolean {
  return serverAlreadyRunning;
}

export async function setup() {
  initializeLogging();

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
    if (err.code === 'EADDRINUSE') {
      serverAlreadyRunning = true;
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { buildService } from '@edfi/meadowlark-fastify/src/Service';
import { CachedEnvironmentConfigProvider, Config, initializeLogging } from '@edfi/meadowlark-utilities';

let serverInstance;
let serverAlreadyRunning = false;

export function wasServerAlreadyRunning(): boolean {
  return serverAlreadyRunning;
}

export async function setup() {
  await Config.initializeConfig(CachedEnvironmentConfigProvider);
  initializeLogging();

  serverInstance = buildService();
  try {
    await serverInstance.listen(Config.get('FASTIFY_PORT'));
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      serverAlreadyRunning = true;
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}

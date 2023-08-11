// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* istanbul ignore file */
import dotenv from 'dotenv';
import { initializeLogging, Config, CachedEnvironmentConfigProvider } from '@edfi/meadowlark-utilities';
import { ClusterService } from './ClusterService';
import { serviceFactory } from './ServiceFactory';

dotenv.config();

const start = async () => {
  await Config.initializeConfig(CachedEnvironmentConfigProvider);
  initializeLogging();

  if (Config.get<number>('FASTIFY_NUM_THREADS') === 1) {
    // Don't bother with cluster if requesting single threaded
    await serviceFactory(0);
  } else {
    new ClusterService(serviceFactory).run();
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start();

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* istanbul ignore file */
import dotenv from 'dotenv';
import { initializeLogging, Config, CachedEnvironmentConfigProvider } from '@edfi/meadowlark-utilities';
import { ClusterService } from './Cluster';
import { serviceFactory } from './Factory';

dotenv.config();

const start = async () => {
  initializeLogging();
  await Config.initializeConfig(CachedEnvironmentConfigProvider);

  new ClusterService(serviceFactory).run();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start();

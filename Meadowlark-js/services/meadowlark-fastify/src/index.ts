// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import dotenv from 'dotenv';
import { initializeLogging } from '@edfi/meadowlark-utilities';
import { ClusterService } from './Cluster';
import { serviceFactory } from './Factory';

dotenv.config();

const start = async () => {
  initializeLogging();

  new ClusterService(serviceFactory).run();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start();

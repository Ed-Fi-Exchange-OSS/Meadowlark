// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { FastifyInstance } from 'fastify';
import { buildService } from './Service';

const start = async () => {
  const service: FastifyInstance = buildService();
  try {
    await service.listen(3000);
  } catch (err) {
    service.log.error(err);
    process.exit(1);
  }
};
start();

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { CachedEnvironmentConfigProvider, Config } from '@edfi/meadowlark-utilities';
import { join } from 'path';

export const setupConfigForIntegration = async () => {
  // First look for .env file paired with this Config.ts file
  let path = join(__dirname, '.env');

  if (!existsSync(path)) {
    path = join(process.cwd(), '.env');
  }

  if (!existsSync(path)) {
    // eslint-disable-next-line no-console
    console.error(`Cannot run integration tests because there is no .env file in '${path}'`);
    process.exit(-1);
  }

  dotenv.config({ path });

  await Config.initializeConfig(CachedEnvironmentConfigProvider);
};

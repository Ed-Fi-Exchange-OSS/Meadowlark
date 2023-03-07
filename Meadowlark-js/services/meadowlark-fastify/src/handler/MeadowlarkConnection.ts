// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { closeConnection as meadowlarkCloseConnection } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';

/**
 * Close database connection
 */
export async function closeMeadowlarkConnection(): Promise<void> {
  Logger.info(`Close database connection.`, null);
  await meadowlarkCloseConnection();
}

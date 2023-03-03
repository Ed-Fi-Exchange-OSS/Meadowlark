// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeErrorToLog } from '@edfi/meadowlark-utilities';
import { getDocumentStore, getQueryHandler } from '../plugin/PluginLoader';

const moduleName = 'core.handler.Connection';
async function closeSharedConnection(): Promise<void> {
  await getDocumentStore().closeConnection();
}

async function closeQueryConnection(): Promise<void> {
  await getQueryHandler().closeConnection();
}

export async function closeConnection(): Promise<void> {
  try {
    // close all connections
    await closeQueryConnection();
    await closeSharedConnection();
  } catch (e) {
    writeErrorToLog(moduleName, '', 'closeConnection', 500, e);
  }
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { writeErrorToLog } from '@edfi/meadowlark-utilities';
import { getDocumentStore, getQueryHandler } from '../plugin/PluginLoader';

const moduleName = 'core.handler.Connection';
async function closeSharedConnection(): Promise<void> {
  try {
    await getDocumentStore().closeConnection();
  } catch (e) {
    writeErrorToLog(moduleName, '', 'closeConnection', 500, e);
  }
}

async function closeQueryConnection(): Promise<void> {
  return getQueryHandler().closeConnection();
}

export async function closeConnection(): Promise<void> {
  // close all connections
  await closeQueryConnection();
  await closeSharedConnection();
}

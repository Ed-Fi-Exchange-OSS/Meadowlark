// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { Logger, writeErrorToLog } from '@edfi/meadowlark-utilities';
import { AuthorizationStoreInitializer } from './AuthorizationStoreInitializer';
import { AuthorizationStorePlugin } from './AuthorizationStorePlugin';
import { NoAuthorizationStorePlugin } from './NoAuthorizationStorePlugin';

const moduleName = 'authz.plugin.AuthorizationPluginLoader';

let loadedAuthorizationStore: AuthorizationStorePlugin = NoAuthorizationStorePlugin;

export async function loadAuthorizationStore() {
  if (loadedAuthorizationStore !== NoAuthorizationStorePlugin) return;

  if (process.env.AUTHORIZATION_STORE_PLUGIN == null) return;

  Logger.debug(`${moduleName}.loadAuthorizationStore - loading plugin ${process.env.AUTHORIZATION_STORE_PLUGIN}`, null);

  try {
    loadedAuthorizationStore = (
      (await import(process.env.AUTHORIZATION_STORE_PLUGIN)) as AuthorizationStoreInitializer
    ).initializeAuthorizationStore();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    Logger.error(
      `Unable to load authorization store plugin "${process.env.AUTHORIZATION_STORE_PLUGIN}". Error was ${message}`,
      null,
    );
    throw e;
  }
}

export function getAuthorizationStore(): AuthorizationStorePlugin {
  return loadedAuthorizationStore;
}

async function loadAllPlugins(): Promise<void> {
  Logger.debug(`${moduleName}.loadAllPlugins`, null);
  try {
    await loadAuthorizationStore();
  } catch (e) {
    writeErrorToLog(`${moduleName}.loadAllPlugins`, '', 'loadAllPlugins', 500, e);
  }
}

/**
 * Ensures all plugins are loaded
 */
export const ensurePluginsLoaded = R.once(loadAllPlugins);

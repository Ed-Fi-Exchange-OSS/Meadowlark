// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { Config, Logger, writeErrorToLog } from '@edfi/meadowlark-utilities';
import { AuthorizationStoreInitializer } from './AuthorizationStoreInitializer';
import { AuthorizationStorePlugin } from './AuthorizationStorePlugin';
import { NoAuthorizationStorePlugin } from './NoAuthorizationStorePlugin';

const moduleName = 'authz.plugin.AuthorizationPluginLoader';

let loadedAuthorizationStore: AuthorizationStorePlugin = NoAuthorizationStorePlugin;

export async function loadAuthorizationStore() {
  if (loadedAuthorizationStore !== NoAuthorizationStorePlugin) return;

  const authStorePlugin: string = Config.get('AUTHORIZATION_STORE_PLUGIN');

  Logger.debug(`${moduleName}.loadAuthorizationStore - loading plugin ${authStorePlugin}`, null);

  try {
    loadedAuthorizationStore = (
      (await import(authStorePlugin)) as AuthorizationStoreInitializer
    ).initializeAuthorizationStore();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    Logger.error(`Unable to load authorization store plugin "${authStorePlugin}". Error was ${message}`, null);
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

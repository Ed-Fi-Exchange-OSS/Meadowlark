// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
/* eslint-disable global-require */
import dotenv from 'dotenv';
import { Logger } from '../helpers/Logger';
import { MeadowlarkBackendPlugin } from './backend/MeadowlarkBackendPlugin';
import { NoMeadowlarkBackendPlugin } from './backend/NoMeadowlarkBackendPlugin';

dotenv.config();

// Default to no backend plugin
let loadedBackendPlugin: MeadowlarkBackendPlugin = NoMeadowlarkBackendPlugin;

// Dynamic import
async function loadBackendPlugin(pluginNpmName: string) {
  return ((await import(pluginNpmName)) as any).initializeBackendPlugin();
}

// Workaround no top-level await with IIFE
(async () => {
  if (process.env.BACKEND_PLUGIN_NAME) {
    try {
      loadedBackendPlugin = await loadBackendPlugin(process.env.BACKEND_PLUGIN_NAME);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown';
      Logger.error(`Unable to load backend plugin "${process.env.BACKEND_PLUGIN_NAME}". Error was ${message}`, null);
      throw e;
    }
  }
})();

export function getBackendPlugin(): MeadowlarkBackendPlugin {
  return loadedBackendPlugin;
}

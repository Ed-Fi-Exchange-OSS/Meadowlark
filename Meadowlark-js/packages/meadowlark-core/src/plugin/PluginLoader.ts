// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { Config, Logger, writeErrorToLog } from '@edfi/meadowlark-utilities';
import { DocumentStoreInitializer } from './backend/DocumentStoreInitializer';
import { DocumentStorePlugin } from './backend/DocumentStorePlugin';
import { ListenerInitializer } from './backend/ListenerInitializer';
import { NoDocumentStorePlugin } from './backend/NoDocumentStorePlugin';
import { NoQueryHandlerPlugin } from './backend/NoQueryHandlerPlugin';
import { QueryHandlerInitializer } from './backend/QueryHandlerInitializer';
import { QueryHandlerPlugin } from './backend/QueryHandlerPlugin';
import { Subscribe } from './listener/Subscribe';

let loadedDocumentStore: DocumentStorePlugin = NoDocumentStorePlugin;
let loadedQueryHandler: QueryHandlerPlugin = NoQueryHandlerPlugin;
let listenersLoadAttempted: boolean = false;

const moduleName = 'core.plugin.PluginLoader';

export async function loadDocumentStore() {
  if (loadedDocumentStore !== NoDocumentStorePlugin) return;

  const docStorePlugin: string = Config.get('DOCUMENT_STORE_PLUGIN');

  Logger.debug(`${moduleName}.loadDocumentStore Loading plugin ${docStorePlugin}`, '');

  try {
    loadedDocumentStore = ((await import(docStorePlugin)) as DocumentStoreInitializer).initializeDocumentStore();
  } catch (e) {
    Logger.error(`${moduleName}.loadDocumentStore Unable to load document store plugin "${docStorePlugin}".`, e);
    throw e;
  }
}

export async function loadQueryHandler() {
  if (loadedQueryHandler !== NoQueryHandlerPlugin) return;

  const queryHandlerPlugin: string = Config.get('QUERY_HANDLER_PLUGIN');

  Logger.debug(`${moduleName}.loadQueryHandler Loading plugin ${queryHandlerPlugin}`, null);

  try {
    loadedQueryHandler = ((await import(queryHandlerPlugin)) as QueryHandlerInitializer).initializeQueryHandler();
  } catch (e) {
    Logger.error(`${moduleName}.loadQueryHandler Unable to load query handler plugin "${queryHandlerPlugin}".`, e);
    throw e;
  }
}

async function loadListener(pluginNpmName: string) {
  Logger.debug(`${moduleName}.loadListener loading plugin ${pluginNpmName}`, '');

  return ((await import(pluginNpmName)) as ListenerInitializer).initializeListener(Subscribe);
}

export async function loadListeners() {
  if (listenersLoadAttempted) return;

  listenersLoadAttempted = true;

  const listener1: string = Config.get('LISTENER1_PLUGIN');

  // If this works out, we'll discover listeners dynamically - no need to specify
  if (listener1 !== '') {
    try {
      await loadListener(listener1);
    } catch (e) {
      Logger.error(`${moduleName}.loadListeners Unable to load listener plugin "${listener1}"`, e);
      throw e;
    }
  }

  const listener2: string = Config.get('LISTENER2_PLUGIN');
  if (listener2 !== '') {
    try {
      await loadListener(listener2);
    } catch (e) {
      Logger.error(`${moduleName}.loadListeners Unable to load listener plugin "${listener2}"`, e);
      throw e;
    }
  }
}

export function getDocumentStore(): DocumentStorePlugin {
  return loadedDocumentStore;
}

export function getQueryHandler(): QueryHandlerPlugin {
  return loadedQueryHandler;
}

async function loadAllPlugins(): Promise<void> {
  Logger.info(`${moduleName}.loadAllPlugins`, null);
  try {
    await loadDocumentStore();
    await loadQueryHandler();
    await loadListeners();
  } catch (e) {
    writeErrorToLog(moduleName, '', 'loadAllPlugins', 500, e);
  }
}

/**
 * Ensures all plugins are loaded
 */
export const ensurePluginsLoaded = R.once(loadAllPlugins);

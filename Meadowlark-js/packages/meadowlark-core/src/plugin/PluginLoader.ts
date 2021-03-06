// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { Logger, writeErrorToLog } from '../Logger';
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

export async function loadDocumentStore() {
  if (loadedDocumentStore !== NoDocumentStorePlugin) return;

  if (process.env.DOCUMENT_STORE_PLUGIN == null) return;

  Logger.debug(`PluginLoader.loadDocumentStore - loading plugin ${process.env.DOCUMENT_STORE_PLUGIN}`, '');

  try {
    loadedDocumentStore = (
      (await import(process.env.DOCUMENT_STORE_PLUGIN)) as DocumentStoreInitializer
    ).initializeDocumentStore();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    Logger.error(`Unable to load document store plugin "${process.env.DOCUMENT_STORE_PLUGIN}". Error was ${message}`, null);
    throw e;
  }
}

export async function loadQueryHandler() {
  if (loadedQueryHandler !== NoQueryHandlerPlugin) return;

  if (process.env.QUERY_HANDLER_PLUGIN == null) return;

  Logger.debug(`PluginLoader.loadQueryHandler - loading plugin ${process.env.QUERY_HANDLER_PLUGIN}`, '');

  try {
    loadedQueryHandler = (
      (await import(process.env.QUERY_HANDLER_PLUGIN)) as QueryHandlerInitializer
    ).initializeQueryHandler();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    Logger.error(`Unable to load query handler plugin "${process.env.QUERY_HANDLER_PLUGIN}". Error was ${message}`, null);
    throw e;
  }
}

async function loadListener(pluginNpmName: string) {
  Logger.debug(`PluginLoader.loadListener - loading plugin ${pluginNpmName}`, '');

  return ((await import(pluginNpmName)) as ListenerInitializer).initializeListener(Subscribe);
}

export async function loadListeners() {
  if (listenersLoadAttempted) return;

  listenersLoadAttempted = true;

  // If this works out, we'll discover listeners dynamically - no need to specify
  if (process.env.LISTENER1_PLUGIN != null) {
    try {
      await loadListener(process.env.LISTENER1_PLUGIN);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown';
      Logger.error(`Unable to load listener plugin "${process.env.LISTENER1_PLUGIN}". Error was ${message}`, null);
      throw e;
    }
  }

  if (process.env.LISTENER2_PLUGIN != null) {
    try {
      await loadListener(process.env.LISTENER2_PLUGIN);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown';
      Logger.error(`Unable to load listener plugin "${process.env.LISTENER2_PLUGIN}". Error was ${message}`, null);
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
  Logger.debug('PluginLoader.loadAllPlugins', '');
  try {
    await loadDocumentStore();
    await loadQueryHandler();
    await loadListeners();
  } catch (e) {
    writeErrorToLog('PluginLoader', '', 'ensurePluginsLoaded', 500, e);
  }
}

/**
 * Ensures all plugins are loaded
 */
export const ensurePluginsLoaded = R.once(loadAllPlugins);

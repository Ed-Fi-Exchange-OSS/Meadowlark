// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import dotenv from 'dotenv';
import { Logger } from '../Logger';
import { DocumentStoreInitializer } from './backend/DocumentStoreInitializer';
import { DocumentStorePlugin } from './backend/DocumentStorePlugin';
import { ListenerInitializer } from './backend/ListenerInitializer';
import { NoDocumentStorePlugin } from './backend/NoDocumentStorePlugin';
import { NoQueryHandlerPlugin } from './backend/NoQueryHandlerPlugin';
import { QueryHandlerInitializer } from './backend/QueryHandlerInitializer';
import { QueryHandlerPlugin } from './backend/QueryHandlerPlugin';

dotenv.config();

// Default to "no" plugin
let loadedDocumentStore: DocumentStorePlugin = NoDocumentStorePlugin;
let loadedQueryHandler: QueryHandlerPlugin = NoQueryHandlerPlugin;

async function loadDocumentStore(pluginNpmName: string) {
  return ((await import(pluginNpmName)) as DocumentStoreInitializer).initializeDocumentStore();
}

async function loadQueryHandler(pluginNpmName: string) {
  return ((await import(pluginNpmName)) as QueryHandlerInitializer).initializeQueryHandler();
}

async function loadListener(pluginNpmName: string) {
  return ((await import(pluginNpmName)) as ListenerInitializer).initializeListener();
}

// IIFE for top-level await
(async () => {
  if (process.env.DOCUMENT_STORE_PLUGIN != null) {
    try {
      loadedDocumentStore = await loadDocumentStore(process.env.DOCUMENT_STORE_PLUGIN);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown';
      Logger.error(
        `Unable to load document store plugin "${process.env.DOCUMENT_STORE_PLUGIN}". Error was ${message}`,
        null,
      );
      throw e;
    }
  }

  if (process.env.QUERY_HANDLER_PLUGIN != null) {
    try {
      loadedQueryHandler = await loadQueryHandler(process.env.QUERY_HANDLER_PLUGIN);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown';
      Logger.error(`Unable to load query handler plugin "${process.env.QUERY_HANDLER_PLUGIN}". Error was ${message}`, null);
      throw e;
    }
  }

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
})();

export function getDocumentStore(): DocumentStorePlugin {
  return loadedDocumentStore;
}

export function getQueryHandler(): QueryHandlerPlugin {
  return loadedQueryHandler;
}

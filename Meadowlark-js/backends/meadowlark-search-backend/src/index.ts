// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { QueryHandlerPlugin, Subscribe } from '@edfi/meadowlark-core';
import {
  afterDeleteDocumentById,
  afterUpdateDocumentById,
  afterUpsertDocument,
  queryDocuments,
  closeConnection,
} from './BackendFacade';

export function initializeQueryHandler(): QueryHandlerPlugin {
  return {
    queryDocuments,
    closeConnection,
  };
}

export function initializeListener(subscribe: typeof Subscribe): void {
  subscribe.afterDeleteDocumentById(afterDeleteDocumentById);
  subscribe.afterUpsertDocument(afterUpsertDocument);
  subscribe.afterUpdateDocumentById(afterUpdateDocumentById);
}

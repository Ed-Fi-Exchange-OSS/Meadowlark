// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentStorePlugin, QueryHandlerPlugin } from '@edfi/meadowlark-core';
import {
  createEntity as upsertDocument,
  getEntityById as getDocumentById,
  updateEntityById as updateDocumentById,
} from './DynamoEntityRepository';
import { queryEntityList as queryDocuments } from './OpenSearchRepository';
import { deleteEntityById as deleteDocumentById } from './DeleteOrchestrator';

export function initializeDocumentStore(): DocumentStorePlugin {
  return {
    upsertDocument,
    getDocumentById,
    updateDocumentById,
    deleteDocumentById,
  };
}

export function initializeQueryHandler(): QueryHandlerPlugin {
  return { queryDocuments };
}

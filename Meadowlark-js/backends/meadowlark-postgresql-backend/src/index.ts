// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentStorePlugin, QueryHandlerPlugin } from '@edfi/meadowlark-core';
import {
  upsertDocument,
  deleteDocumentById,
  getDocumentById,
  updateDocumentById,
  securityMiddleware,
  queryDocuments,
} from './BackendFacade';

export function initializeDocumentStore(): DocumentStorePlugin {
  return {
    upsertDocument,
    getDocumentById,
    updateDocumentById,
    deleteDocumentById,
    securityMiddleware,
  };
}

export function initializeQueryHandler(): QueryHandlerPlugin {
  return {
    queryDocuments,
  };
}

export { systemTestSetup, systemTestTeardown } from './repository/SystemTestHelper';

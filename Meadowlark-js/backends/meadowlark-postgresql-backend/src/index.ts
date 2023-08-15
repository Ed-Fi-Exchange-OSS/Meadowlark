// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentStorePlugin } from '@edfi/meadowlark-core';
import { AuthorizationStorePlugin } from '@edfi/meadowlark-authz-server';
import {
  upsertDocument,
  deleteDocumentById,
  getDocumentById,
  updateDocumentById,
  securityMiddleware,
  createAuthorizationClientDocument,
  updateAuthorizationClientDocument,
  getAuthorizationClientDocument,
  getAllAuthorizationClientDocuments,
  resetAuthorizationClientSecret,
  tryCreateBootstrapAuthorizationAdminDocument,
  closeConnection,
} from './BackendFacade';

export function initializeDocumentStore(): DocumentStorePlugin {
  return {
    upsertDocument,
    getDocumentById,
    updateDocumentById,
    deleteDocumentById,
    securityMiddleware,
    closeConnection,
  };
}

export function initializeAuthorizationStore(): AuthorizationStorePlugin {
  return {
    createAuthorizationClient: createAuthorizationClientDocument,
    tryCreateBootstrapAuthorizationAdmin: tryCreateBootstrapAuthorizationAdminDocument,
    updateAuthorizationClient: updateAuthorizationClientDocument,
    getAuthorizationClient: getAuthorizationClientDocument,
    resetAuthorizationClientSecret,
    getAllAuthorizationClients: getAllAuthorizationClientDocuments,
  };
}

export { systemTestSetup, systemTestTeardown } from './repository/SystemTestHelper';

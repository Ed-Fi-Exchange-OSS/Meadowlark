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

export function initializeAuthorizationStore(): AuthorizationStorePlugin {
  return {
    createAuthorizationClient: createAuthorizationClientDocument,
    updateAuthorizationClient: updateAuthorizationClientDocument,
    getAuthorizationClient: getAuthorizationClientDocument,
  };
}

// Accessible for system testing - this may turn into a generic setup/teardown datastore interface
export { getNewClient, getDocumentCollection, getAuthorizationCollection, resetSharedClient } from './repository/Db';
export { systemTestSetup, systemTestTeardown } from './repository/SystemTestHelper';

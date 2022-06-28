// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentStorePlugin } from '@edfi/meadowlark-core';
import {
  upsertDocument,
  deleteDocumentById,
  getDocumentById,
  updateDocumentById,
  securityMiddleware,
} from './BackendFacade';
import { TestingSetup, TestingTeardown, TearDownAndReleasePool } from './repository/TestHelper';

export function initializeDocumentStore(): DocumentStorePlugin {
  return {
    upsertDocument,
    getDocumentById,
    updateDocumentById,
    deleteDocumentById,
    securityMiddleware,
  };
}
export { TestingTeardown, TestingSetup, TearDownAndReleasePool };

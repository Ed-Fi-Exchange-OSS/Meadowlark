// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkBackendPlugin } from '@edfi/meadowlark-core';
import {
  upsertDocument,
  deleteDocumentById,
  getDocumentById,
  getDocumentList,
  queryDocumentList,
  updateDocumentById,
} from './BackendFacade';

export function initializeBackendPlugin(): MeadowlarkBackendPlugin {
  return {
    upsertDocument,
    getDocumentById,
    getDocumentList,
    updateDocumentById,
    deleteDocumentById,
    queryDocumentList,
  };
}

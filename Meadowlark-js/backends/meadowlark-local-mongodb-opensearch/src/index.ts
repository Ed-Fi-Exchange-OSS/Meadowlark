// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkBackendPlugin } from '@edfi/meadowlark-core';
import { createDocument } from './repository/Create';
import { deleteDocumentById } from './repository/Delete';
import { getDocumentById } from './repository/Read';
import { getDocumentList, queryDocumentList } from './repository/Query';
import { updateDocumentById } from './repository/Update';

export function initializeBackendPlugin(): MeadowlarkBackendPlugin {
  return {
    createDocument,
    getDocumentById,
    getDocumentList,
    updateDocumentById,
    deleteDocumentById,
    queryDocumentList,
  };
}

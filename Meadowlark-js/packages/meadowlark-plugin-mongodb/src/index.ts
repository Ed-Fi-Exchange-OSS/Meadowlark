// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkBackendPlugin } from '@edfi/meadowlark-core';
import { createEntity } from './repository/Create';
import { deleteEntityById, deleteItems } from './repository/Delete';
import { getEntityById } from './repository/Read';
import { getEntityList, queryEntityList } from './repository/Query';
import { updateEntityById } from './repository/Update';
import { getForeignKeyReferences, getReferencesToThisItem, validateEntityOwnership } from './repository/Unknown';

export function initializeBackendPlugin(): MeadowlarkBackendPlugin {
  return {
    createEntity,
    getEntityById,
    getEntityList,
    updateEntityById,
    deleteEntityById,
    getReferencesToThisItem,
    getForeignKeyReferences,
    deleteItems,
    validateEntityOwnership,
    queryEntityList,
  };
}

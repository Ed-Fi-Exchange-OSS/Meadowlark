// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkBackendPlugin } from '../../plugin/backend/MeadowlarkBackendPlugin';
import {
  createEntity,
  deleteEntityById,
  deleteItems,
  getEntityById,
  getEntityList,
  getForeignKeyReferences,
  getReferencesToThisItem,
  updateEntityById,
  validateEntityOwnership,
} from './DynamoEntityRepository';
import { queryEntityList } from './ElasticsearchRepository';

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

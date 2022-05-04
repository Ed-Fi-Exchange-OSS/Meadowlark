// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkBackendPlugin } from '@edfi/meadowlark-core';
import { createEntity } from './repository/Create';
import { deleteEntityById } from './repository/Delete';
import { getEntityById } from './repository/Read';
import { getEntityList, queryEntityList } from './repository/Query';
import { updateEntityById } from './repository/Update';

export function initializeBackendPlugin(): MeadowlarkBackendPlugin {
  return {
    createEntity,
    getEntityById,
    getEntityList,
    updateEntityById,
    deleteEntityById,
    queryEntityList,
  };
}

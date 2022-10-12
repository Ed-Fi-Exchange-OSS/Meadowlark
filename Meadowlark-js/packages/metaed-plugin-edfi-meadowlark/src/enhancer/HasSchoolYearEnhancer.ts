// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EnhancerResult, MetaEdEnvironment, getAllEntitiesOfType, ModelBase } from '@edfi/metaed-core';
import { CollectedProperty } from '../model/CollectedProperty';
import { EntityMeadowlarkData } from '../model/EntityMeadowlarkData';

const enhancerName = 'HasSchoolYearEnhancer';

/**
 * This enhancer pre-determines if a given entity type contains a schoolYearEnumeration.
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  getAllEntitiesOfType(metaEd, 'domainEntity', 'association', 'domainEntitySubclass', 'associationSubclass').forEach(
    (entity: ModelBase) => {
      const meadowlarkEntity = entity.data.meadowlark as EntityMeadowlarkData;

      meadowlarkEntity.hasSchoolYear = meadowlarkEntity.collectedProperties.some(
        (property: CollectedProperty) => property.property.type === 'schoolYearEnumeration',
      );
    },
  );

  return {
    enhancerName,
    success: true,
  };
}

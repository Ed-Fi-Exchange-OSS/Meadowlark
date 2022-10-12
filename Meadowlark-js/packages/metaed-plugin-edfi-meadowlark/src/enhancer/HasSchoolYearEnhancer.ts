// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  EnhancerResult,
  MetaEdEnvironment,
  getAllEntitiesOfType,
  ModelBase,
  ReferentialProperty,
  EntityProperty,
} from '@edfi/metaed-core';
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

      const hasSchoolYearEnumeration = (property: EntityProperty) => property.type === 'schoolYearEnumeration';

      meadowlarkEntity.hasSchoolYear = meadowlarkEntity.collectedProperties.some(
        (collectedProperty: CollectedProperty) =>
          hasSchoolYearEnumeration(collectedProperty.property) ||
          // Look for any commons that contain a SchoolYear Enumeration
          (collectedProperty.property.type === 'common' &&
            (collectedProperty.property as ReferentialProperty).referencedEntity.properties.some(hasSchoolYearEnumeration)),
      );
    },
  );

  return {
    enhancerName,
    success: true,
  };
}

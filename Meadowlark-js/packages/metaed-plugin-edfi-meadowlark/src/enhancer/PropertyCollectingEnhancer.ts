// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAllEntitiesOfType, MetaEdEnvironment, EnhancerResult, TopLevelEntity } from '@edfi/metaed-core';
import { CollectedProperty } from '../model/CollectedProperty';
import { EntityMeadowlarkData } from '../model/EntityMeadowlarkData';
import { defaultPropertyModifier } from '../model/PropertyModifier';
import { collectProperties } from './BasePropertyCollectingEnhancer';

/**
 * Accumulates properties that belong under an entity in the API body.
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  getAllEntitiesOfType(metaEd, 'domainEntity', 'association', 'common').forEach((entity) => {
    const collectedProperties: CollectedProperty[] = [];
    (entity as TopLevelEntity).properties.forEach((property) => {
      collectProperties(collectedProperties, property, defaultPropertyModifier);
    });
    (entity.data.meadowlark as EntityMeadowlarkData).collectedProperties = collectedProperties;
  });

  return {
    enhancerName: 'PropertyCollectingEnhancer',
    success: true,
  };
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MetaEdEnvironment, EnhancerResult, EntityProperty, getAllEntitiesOfType, TopLevelEntity } from '@edfi/metaed-core';

import { ApiEntityMapping, NoApiEntityMapping } from '../model/ApiEntityMapping';
import {
  flattenedIdentityPropertiesFrom,
  identityReferenceComponentsFrom,
  referenceGroupsFrom,
  descriptorCollectedPropertiesFrom,
  superclassFor,
} from './ApiEntityMappingEnhancerBase';
import { EntityMeadowlarkData } from '../model/EntityMeadowlarkData';

/**
 * Returns properties sorted by name ascending, optionally with the given property removed
 */
function sortedPropertiesWithExclusion(properties: EntityProperty[], excludedProperty: EntityProperty | undefined) {
  return [...properties]
    .filter((p) => p !== excludedProperty)
    .sort((a, b) => a.fullPropertyName.localeCompare(b.fullPropertyName));
}

/**
 * Collects all of the API shape metadata for a MetaEd subclass entity.
 */
function buildApiEntityMappingForSubclass(entity: TopLevelEntity): ApiEntityMapping {
  if (entity.baseEntity == null) return NoApiEntityMapping;

  const subclassRenamedIdentityProperty: EntityProperty | undefined = entity.properties.find((p) => p.isIdentityRename);
  const baseClassRenamedProperty: EntityProperty | undefined =
    subclassRenamedIdentityProperty === undefined
      ? undefined
      : entity.baseEntity.properties.find((p) => p.metaEdName === subclassRenamedIdentityProperty.baseKeyName);

  const combinedIdentityProperties = sortedPropertiesWithExclusion(
    [...entity.identityProperties, ...entity.baseEntity.identityProperties],
    baseClassRenamedProperty,
  );
  const combinedProperties = sortedPropertiesWithExclusion(
    [...entity.properties, ...entity.baseEntity.properties],
    baseClassRenamedProperty,
  );

  return {
    flattenedIdentityProperties: flattenedIdentityPropertiesFrom(combinedIdentityProperties),
    identityReferenceComponents: identityReferenceComponentsFrom(combinedIdentityProperties),
    referenceGroups: referenceGroupsFrom(combinedProperties),
    descriptorCollectedProperties: descriptorCollectedPropertiesFrom(entity),
    superclass: superclassFor(entity),
  };
}

/**
 * This enhancer uses the results of the ReferenceComponentEnhancer to build API
 * shape metadata for each MetaEd subclass entity.
 *
 * Note, this enhancer is dependent on ApiPropertyMappingEnhancer
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  getAllEntitiesOfType(metaEd, 'domainEntitySubclass', 'associationSubclass').forEach((entity) => {
    (entity.data.meadowlark as EntityMeadowlarkData).apiMapping = buildApiEntityMappingForSubclass(entity as TopLevelEntity);
  });

  return {
    enhancerName: 'SubclassApiEntityMappingEnhancer',
    success: true,
  };
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MetaEdEnvironment, EnhancerResult, TopLevelEntity, getAllEntitiesOfType } from 'metaed-core';
import { fullName } from '../Utility';
import { ApiEntityMapping } from '../model/ApiEntityMapping';
import {
  assignabilityFor,
  descriptorCollectedPropertiesFrom,
  flattenedIdentityPropertiesFrom,
  identityReferenceComponentsFrom,
  referenceGroupsFrom,
} from './ApiEntityMappingEnhancerBase';
import { EntityMeadowlarkData } from '../model/EntityMeadowlarkData';

/**
 * Collects all of the API shape metadata for a MetaEd non-subclass entity.
 */
function buildApiEntityMapping(entity: TopLevelEntity): ApiEntityMapping {
  const identityProperties = [...entity.identityProperties].sort((a, b) => fullName(a).localeCompare(fullName(b)));
  const properties = [...entity.properties].sort((a, b) => fullName(a).localeCompare(fullName(b)));
  return {
    flattenedIdentityProperties: flattenedIdentityPropertiesFrom(identityProperties),
    identityReferenceComponents: identityReferenceComponentsFrom(identityProperties),
    referenceGroups: referenceGroupsFrom(properties),
    descriptorCollectedProperties: descriptorCollectedPropertiesFrom(entity),
    assignableTo: assignabilityFor(entity),
  };
}

/**
 * This enhancer uses the results of the ReferenceComponentEnhancer to build API
 * shape metadata for each MetaEd entity.
 *
 * Note, this enhancer is dependent on ApiPropertyMappingEnhancer
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  getAllEntitiesOfType(metaEd, 'domainEntity', 'association').forEach((entity) => {
    (entity.data.meadowlark as EntityMeadowlarkData).apiMapping = buildApiEntityMapping(entity as TopLevelEntity);
  });

  return {
    enhancerName: 'ApiEntityMappingEnhancer',
    success: true,
  };
}

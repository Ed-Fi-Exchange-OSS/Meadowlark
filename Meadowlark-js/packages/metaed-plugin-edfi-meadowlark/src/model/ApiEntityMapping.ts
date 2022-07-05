// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import deepFreeze from 'deep-freeze';
import { EntityProperty, TopLevelEntity } from '@edfi/metaed-core';
import { CollectedProperty } from './CollectedProperty';
import { ReferenceComponent, ReferenceGroup } from './ReferenceComponent';

/**
 * API shape metadata for a MetaEd entity.
 */
export type ApiEntityMapping = {
  /**
   * The non-reference properties that make up the identity
   * of the entity, in sorted order.
   */
  flattenedIdentityProperties: EntityProperty[];

  /**
   * The ReferenceComponents of all of the identity properties
   * of the entity.
   */
  identityReferenceComponents: ReferenceComponent[];

  /**
   * The ReferenceGroups of all of the properties of the entity.
   */
  referenceGroups: ReferenceGroup[];

  /**
   * ApiPropertyMappings of all of the descriptor properties on the entity.
   */
  descriptorCollectedProperties: CollectedProperty[];

  /**
   * If the entity for this mapping is in a subclass/superclass relationship, this is the superclass entity
   * (MetaEd only allows a single level of subclassing.)
   *
   * Example 1: If the entity for this mapping is School (subclass of EducationOrganization),
   *            then superclass would be EducationOrganization.
   * Example 2: If the entity is GradingPeriod (not a subclass), assignableTo would be null.
   */
  superclass: TopLevelEntity | null;
};

export function newApiEntityMapping(): ApiEntityMapping {
  return {
    flattenedIdentityProperties: [],
    identityReferenceComponents: [],
    referenceGroups: [],
    descriptorCollectedProperties: [],
    superclass: null,
  };
}

export const NoApiEntityMapping: ApiEntityMapping = deepFreeze({
  ...newApiEntityMapping(),
});

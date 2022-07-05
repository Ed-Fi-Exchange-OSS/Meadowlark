// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EntityProperty, TopLevelEntity } from '@edfi/metaed-core';
import {
  ReferenceElement,
  flattenReferenceElementsFromComponent,
  ReferenceComponent,
  ReferenceGroup,
  isReferenceGroup,
} from '../model/ReferenceComponent';
import { CollectedProperty } from '../model/CollectedProperty';
import { EntityMeadowlarkData } from '../model/EntityMeadowlarkData';
import { EntityPropertyMeadowlarkData } from '../model/EntityPropertyMeadowlarkData';

/**
 * All of the identity properties of the given entity, in sorted order
 */
export function identityReferenceComponentsFrom(identityProperties: EntityProperty[]): ReferenceComponent[] {
  return identityProperties.map((property) => (property.data.meadowlark as EntityPropertyMeadowlarkData).referenceComponent);
}

/**
 * All of the reference groups of all of the properties of the given entity, in sorted order
 */
export function referenceGroupsFrom(sortedProperties: EntityProperty[]): ReferenceGroup[] {
  return sortedProperties
    .map((property) => (property.data.meadowlark as EntityPropertyMeadowlarkData).referenceComponent)
    .filter((rc) => isReferenceGroup(rc)) as ReferenceGroup[];
}

/**
 * All of the non-reference properties that make up the identity of the given entity, in sorted order
 */
export function flattenedIdentityPropertiesFrom(identityProperties: EntityProperty[]): EntityProperty[] {
  const referenceElements: ReferenceElement[] = identityProperties.flatMap((identityProperty) =>
    flattenReferenceElementsFromComponent(identityProperty.data.meadowlark.referenceComponent),
  );
  return referenceElements.map((referenceElement) => referenceElement.sourceProperty);
}

/**
 * CollectedProperties of all of the descriptor properties on the entity.
 */
export function descriptorCollectedPropertiesFrom(entity: TopLevelEntity): CollectedProperty[] {
  return (entity.data.meadowlark as EntityMeadowlarkData).collectedProperties.filter(
    (cp) => cp.property.type === 'descriptor',
  );
}

/**
 * If the entity for this mapping is a subclass, returns the superclass entity
 * which it can be assigned to, otherwise null. Note MetaEd only allows a single level of subclassing.
 */
export function superclassFor(entity: TopLevelEntity): TopLevelEntity | null {
  // Specifically exclude Domain Entity/Association Extensions - just to be safe
  if (entity.type === 'domainEntityExtension' || entity.type === 'associationExtension') return null;
  // If it's a subclass, return its superclass
  if (entity.baseEntity != null) return entity.baseEntity;
  return null;
}

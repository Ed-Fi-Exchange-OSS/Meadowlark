// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// may be a candidate for future addition to metaed-plugin-edfi-unified-advanced
import { EnhancerResult, MetaEdEnvironment, ReferentialProperty, EntityProperty, getAllProperties } from '@edfi/metaed-core';
import { EntityPropertyMeadowlarkData } from '../model/EntityPropertyMeadowlarkData';
import { newReferenceElement, ReferenceComponent, newReferenceGroup } from '../model/ReferenceComponent';

const enhancerName = 'ReferenceComponentEnhancer';

/**
 * Recursively build ReferenceComponents for a given property.
 */
function buildReferenceComponent(sourceProperty: EntityProperty): ReferenceComponent {
  if (sourceProperty.type === 'association' || sourceProperty.type === 'domainEntity') {
    const referenceComponents: ReferenceComponent[] = (
      sourceProperty as ReferentialProperty
    ).referencedEntity.identityProperties.map((identityProperty) => buildReferenceComponent(identityProperty));
    referenceComponents.sort((a, b) => a.sourceProperty.fullPropertyName.localeCompare(b.sourceProperty.fullPropertyName));
    return {
      ...newReferenceGroup(),
      sourceProperty,
      referenceComponents,
    };
  }
  return {
    ...newReferenceElement(),
    sourceProperty,
  };
}

/**
 * This enhancer builds a ReferenceComponent object graph for every property.
 * The ReferenceComponent is added directly to the property.
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  getAllProperties(metaEd.propertyIndex).forEach((property) => {
    (property.data.meadowlark as EntityPropertyMeadowlarkData).referenceComponent = buildReferenceComponent(property);
  });

  return {
    enhancerName,
    success: true,
  };
}

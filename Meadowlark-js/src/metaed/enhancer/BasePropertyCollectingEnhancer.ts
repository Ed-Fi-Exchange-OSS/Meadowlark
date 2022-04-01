// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EntityProperty, InlineCommonProperty, ChoiceProperty } from '@edfi/metaed-core';
import { CollectedProperty } from '../model/CollectedProperty';
import { PropertyModifier } from '../model/PropertyModifier';

/**
 * Recursively collects properties in the currentCollection accumulator by following entities
 * referenced by the currentProperty. Also tracks property naming and cardinality modifiers as
 * it follows the chain.
 *
 * InlineCommon and Choice MetaEd entities have no meaning when collecting properties. Instead,
 * references to them act as bags of properties to be pulled up, possibly adding a prefix to the
 * property name in the process.
 *
 * Example 1: If a reference property is optional, all properties in the chain below it must be collected
 * as optional regardless of their actual cardinality.
 * Example 2: If a reference property has a role name, all properties in the chain below it inherit that
 * naming prefix.
 */
export function collectProperties(
  currentCollection: CollectedProperty[],
  currentProperty: EntityProperty,
  propertyModifier: PropertyModifier,
) {
  // InlineCommon and Choice are never objects in the API document. Instead pull up their property collections.
  if (currentProperty.type === 'inlineCommon' || currentProperty.type === 'choice') {
    const optionalDueToParent =
      currentProperty.isOptional || currentProperty.isOptionalCollection || propertyModifier.optionalDueToParent;
    const parentPrefixes =
      currentProperty.roleName === currentProperty.metaEdName
        ? [...propertyModifier.parentPrefixes]
        : [...propertyModifier.parentPrefixes, currentProperty.roleName];
    (currentProperty as InlineCommonProperty | ChoiceProperty).referencedEntity.properties.forEach((property) => {
      collectProperties(currentCollection, property, { optionalDueToParent, parentPrefixes });
    });
  } else {
    currentCollection.push({ property: currentProperty, propertyModifier });
  }
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EntityProperty, NoEntityProperty, TopLevelEntity } from '@edfi/metaed-core';
import inflection from 'inflection';
import { EntityPropertyMeadowlarkData } from './model/EntityPropertyMeadowlarkData';

/**
 * Simplified MetaEd top level reference checking, supporting
 * Association and Domain Entity
 */
export function isTopLevelReference(property: EntityProperty): boolean {
  return property.type === 'association' || property.type === 'domainEntity';
}

/**
 * A MetaEd property type check for a Descriptor reference
 */
export function isDescriptor(property: EntityProperty): boolean {
  return property.type === 'descriptor';
}

export function uncapitalize(text: string): string {
  if (text == null || typeof text !== 'string') return '';
  // Handle text like "URI" -> "uri"
  if (text === text.toUpperCase()) return text.toLowerCase();
  return text.charAt(0).toLowerCase() + text.substr(1);
}

export function capitalize(text: string): string {
  if (text == null || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.substr(1);
}

export function pluralize(text: string): string {
  return inflection.pluralize(text);
}

export function singularize(text: string): string {
  return inflection.singularize(text);
}

export function dropPrefix(prefix: string, str: string) {
  if (str.startsWith(prefix)) {
    return str.slice(prefix.length);
  }
  return str;
}

/**
 * In the ODS/API, top level names on document bodies can be different for the same property, depending
 * on the names of other properties on the same entity.
 *
 * Select the correct top level name to avoid possible collisions between superclass and subclass properties.
 */
export function topLevelNameOnEntity(entity: TopLevelEntity, property: EntityProperty): string {
  const propertyMeadowlarkData = property.data.meadowlark as EntityPropertyMeadowlarkData;

  // Avoid collision if this is a property on the subclass with a superclass conflict
  if (propertyMeadowlarkData.namingCollisionWithSuperclassProperty !== NoEntityProperty) {
    return propertyMeadowlarkData.apiMapping.decollisionedTopLevelName;
  }

  // Avoid collision if this is a property on the superclass with a subclass conflict that applies here.
  // (Note this doesn't handle the case where the property is pulled up but actually on an inline common/choice,
  // but that's hopefully not a valid model scenario anyway due to inline common/choice naming patterns.)
  if (
    propertyMeadowlarkData.namingCollisionWithSubclassProperties.some(
      (subclassProperty) => subclassProperty.parentEntity === entity,
    )
  ) {
    return propertyMeadowlarkData.apiMapping.decollisionedTopLevelName;
  }

  return propertyMeadowlarkData.apiMapping.topLevelName;
}

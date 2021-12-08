// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { uncapitalize, capitalize } from '../Utility';

/**
 * A possible modifier to the API body element shape of a property, based on a factor external
 * to the property itself.
 */
export type PropertyModifier = {
  /**
   * If a parent is optional, everything below is also, regardless of actual property
   * cardinality.
   */
  optionalDueToParent: boolean;
  /**
   * API body elements corresponding to properties can get name prefixes from parents
   * of the property.
   */
  parentPrefixes: string[];
};

/**
 * The default modifier that specifies no modifications
 */
export const defaultPropertyModifier: PropertyModifier = {
  optionalDueToParent: false,
  parentPrefixes: [],
};

/**
 * Returns the property name prefixed by possible parent modifiers.
 */
export function prefixedName(propertyName: string, propertyModifier: PropertyModifier): string {
  const prefix: string = propertyModifier.parentPrefixes.join('');
  if (prefix.length === 0) return propertyName;
  return `${uncapitalize(prefix)}${capitalize(propertyName)}`;
}

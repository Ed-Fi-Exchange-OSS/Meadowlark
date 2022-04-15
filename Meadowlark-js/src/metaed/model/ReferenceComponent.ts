// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import deepFreeze from 'deep-freeze';
import { EntityProperty, newEntityProperty, NoEntityProperty } from '@edfi/metaed-core';

/**
 * A ReferenceComponent is a graph of objects derived from a MetaEd property reference,
 * composed of all the natural key elements that make up the reference.
 *
 * In navigating a single reference, there can be (and usually are) paths
 * of other references that compose the natural key of a reference.  This occurs
 * when parts of the identity of the entity being referenced are themselves references, and
 * so on in a Russian doll-like hierarchy.  ReferenceGroups capture this hierarchy.
 */
// eslint-disable-next-line no-use-before-define
export type ReferenceComponent = ReferenceElement | ReferenceGroup;

/**
 * A grouping of ReferenceComponents derived from a single reference property.
 */
export interface ReferenceGroup {
  /**
   * The reference elements in the correct (alphabetic including role names) order
   */
  referenceComponents: ReferenceComponent[];
  /**
   * The referential source property for the reference group
   */
  sourceProperty: EntityProperty;
  /**
   * Flag indicating this is a ReferenceGroup object
   */
  isGroup: boolean;
}

export function newReferenceGroup(): ReferenceGroup {
  return {
    referenceComponents: [],
    sourceProperty: NoEntityProperty,
    isGroup: true,
  };
}

/**
 * A single element of the reference, derived from a non-reference
 * part of an identity.
 */
export interface ReferenceElement {
  /**
   * The non-referential source property for the reference element
   */
  sourceProperty: EntityProperty;
  /**
   * Flag indicating this is a ReferenceComponent object
   */
  isElement: boolean;
}

export function newReferenceElement(): ReferenceElement {
  return {
    sourceProperty: newEntityProperty(),
    isElement: true,
  };
}

export const NoReferenceElement: ReferenceElement = deepFreeze(newReferenceElement());

export function isReferenceGroup(referenceComponent: ReferenceComponent): referenceComponent is ReferenceGroup {
  return (referenceComponent as ReferenceGroup).isGroup;
}

export function isReferenceElement(referenceComponent: ReferenceComponent): referenceComponent is ReferenceElement {
  return (referenceComponent as ReferenceElement).isElement;
}

/**
 * Flatten a graph of ReferenceComponents into an array of ReferenceElements, discarding any
 * ReferenceGroups that are part of the graph.
 */
export function flattenReferenceElementsFromComponent(referenceComponent: ReferenceComponent): ReferenceElement[] {
  if (isReferenceElement(referenceComponent)) return [referenceComponent];

  const result: ReferenceElement[] = [];
  referenceComponent.referenceComponents.forEach((referenceElement) => {
    if (isReferenceElement(referenceElement)) {
      result.push(referenceElement as ReferenceElement);
    } else {
      result.push(...flattenReferenceElementsFromComponent(referenceElement as ReferenceGroup));
    }
  });
  return result;
}

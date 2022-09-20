// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import deepFreeze from 'deep-freeze';
import { ModelType, PropertyType } from '@edfi/metaed-core';

/**
 * API shape metadata for a MetaEd property.
 */
export type ApiPropertyMapping = {
  /**
   * The metaEdName for this property.
   */
  metaEdName: string;
  /**
   * If this is a referential property, the type of the entity it references. Otherwise, the type of this simple property
   */
  metaEdType: PropertyType | ModelType;
  /**
   * The naming for this property when it is at the top level of the request body.
   */
  topLevelName: string;
  /**
   * The naming for this property when it is at the top level of the request body, and the naming pattern needs
   * collision resolution.
   */
  decollisionedTopLevelName: string;
  /**
   * The basic name of a property in the API.
   */
  fullName: string;
  /**
   * Whether the property is a reference collection.
   */
  isReferenceCollection: boolean;
  /**
   * The reference collection name, or empty string if not a reference collection
   */
  referenceCollectionName: string;
  /**
   * Whether the property is a descriptor collection.
   */
  isDescriptorCollection: boolean;
  /**
   * The descriptor collection name, or empty string if not a descriptor collection
   */
  descriptorCollectionName: string;
  /**
   * Whether the property is a common collection.
   */
  isCommonCollection: boolean;

  /**
   * Whether the property is a scalar common.
   */
  isScalarCommon: boolean;

  /**
   * Whether the property is a scalar reference.
   */
  isScalarReference: boolean;
};

export function newApiPropertyMapping(): ApiPropertyMapping {
  return {
    metaEdName: '',
    metaEdType: 'unknown',
    topLevelName: '',
    decollisionedTopLevelName: '',
    fullName: '',
    isReferenceCollection: false,
    referenceCollectionName: '',
    isDescriptorCollection: false,
    descriptorCollectionName: '',
    isCommonCollection: false,
    isScalarCommon: false,
    isScalarReference: false,
  };
}

export const NoApiPropertyMapping: ApiPropertyMapping = deepFreeze({
  ...newApiPropertyMapping(),
  metaEdName: 'NoApiPropertyMapping',
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  MetaEdEnvironment,
  EnhancerResult,
  EntityProperty,
  getAllProperties,
  isReferentialProperty,
  ReferentialProperty,
  normalizeDescriptorSuffix,
} from 'metaed-core';
import { isTopLevelReference, isCollection, isDescriptor, uncapitalize, pluralize } from '../Utility';
import { ApiPropertyMapping } from '../model/ApiPropertyMapping';
import { EntityPropertyMeadowlarkData } from '../model/EntityPropertyMeadowlarkData';

const enhancerName = 'ApiPropertyMappingEnhancer';

/**
 * API naming removes prefixes of collection properties that match the parent entity name in some cases.
 *
 * This is derived from the ODS/API JSON naming pattern for collections.
 */
function parentPrefixRemovalConvention(property: EntityProperty): string {
  const name = property.fullPropertyName;

  // collections from association and domain entity properties don't get table names collapsed
  if (property.type === 'association' || property.type === 'domainEntity') return name;

  if (name.startsWith(property.parentEntity.metaEdName)) return name.slice(property.parentEntity.metaEdName.length);
  return name;
}

/**
 * API descriptor reference property names are suffixed with "Descriptor"
 */
function apiDescriptorReferenceName(property): string {
  return normalizeDescriptorSuffix(uncapitalize(property.fullPropertyName));
}

/**
 * The basic name of a property in the API.  Generally, the property full name with the
 * first character lower cased, and pluralized if an array.
 */
function apiFullName(property: EntityProperty, { removeCollectionPrefixes }): string {
  if (isCollection(property) && removeCollectionPrefixes) {
    return uncapitalize(pluralize(parentPrefixRemovalConvention(property)));
  }
  if (isCollection(property) && !removeCollectionPrefixes) {
    return uncapitalize(pluralize(property.fullPropertyName));
  }
  if (isDescriptor(property)) return apiDescriptorReferenceName(property);

  return uncapitalize(property.fullPropertyName);
}

/**
 * API reference property names are suffixed with "Reference"
 */
function apiReferenceName(property): string {
  return `${uncapitalize(property.fullPropertyName)}Reference`;
}

/**
 * The naming for a property when it is at the top level of the request body.
 *
 * Non-reference property names are different from reference property ones, and
 * reference property array names are different still.
 */
function apiTopLevelName(property: EntityProperty, { removeCollectionPrefixes }): string {
  if (!isTopLevelReference(property)) return apiFullName(property, { removeCollectionPrefixes });
  if (property.isRequiredCollection || property.isOptionalCollection)
    return apiFullName(property, { removeCollectionPrefixes });
  return apiReferenceName(property);
}

/**
 * Whether the given property will be represented as a reference collection.
 */
function apiReferenceCollection(property): boolean {
  if (!isTopLevelReference(property)) return false;
  if (property.isRequiredCollection || property.isOptionalCollection) return true;
  return false;
}

/**
 * Whether the given property will be represented as a descriptor collection.
 */
function apiDescriptorCollection(property): boolean {
  if (!isDescriptor(property)) return false;
  if (property.isRequiredCollection || property.isOptionalCollection) return true;
  return false;
}

/**
 * Collects all of the API shape metadata for a MetaEd property.
 */
function buildApiPropertyMapping(property: EntityProperty): ApiPropertyMapping {
  const isReferenceCollection = apiReferenceCollection(property);
  const isDescriptorCollection: boolean = apiDescriptorCollection(property);
  return {
    metaEdName: property.metaEdName,
    metaEdType: isReferentialProperty(property) ? (property as ReferentialProperty).referencedEntity.type : property.type,
    topLevelName: apiTopLevelName(property, { removeCollectionPrefixes: true }),
    decollisionedTopLevelName: apiTopLevelName(property, { removeCollectionPrefixes: false }),
    fullName: apiFullName(property, { removeCollectionPrefixes: true }),
    isReferenceCollection,
    referenceCollectionName: isReferenceCollection ? apiReferenceName(property) : '',
    isDescriptorCollection,
    descriptorCollectionName: isDescriptorCollection ? apiDescriptorReferenceName(property) : '',
  };
}

/**
 * This enhancer uses the results of the ReferenceComponentEnhancer to build API
 * shape metadata for each MetaEd property.
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  getAllProperties(metaEd.propertyIndex).forEach((property) => {
    (property.data.meadowlark as EntityPropertyMeadowlarkData).apiMapping = buildApiPropertyMapping(property);
  });

  return {
    enhancerName,
    success: true,
  };
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  MetaEdEnvironment,
  EnhancerResult,
  TopLevelEntity,
  getAllEntitiesOfType,
  NoEntityProperty,
} from '@edfi/metaed-core';
import { EntityPropertyMeadowlarkData } from '../model/EntityPropertyMeadowlarkData';
import { dropPrefix } from '../Utility';

/**
 * This enhancer flags properties on subclasses that will have naming collision issues due to a superclass property
 * name, which is a consequence of the ODS/API's JSON collection name shortening rule.
 *
 * The name shortening rule is that if a non-reference (not a domain entity or association) collection property's
 * name is prefixed with the name of the parent entity, the prefix is removed from the name of the JSON element.
 *
 * Example: Assessment has a collection of AssessmentIdentificationCodes. The JSON element name for this
 *          array is "identificationCodes", with the "assessment" prefix removed.
 *
 * Collision example: School is a subclass of EducationOrganization. School has a collection of SchoolCategories,
 *                    and EducationOrganization has a collection of EducationOrganizationCategories. It would be
 *                    a collision for both to be shortened to "categories" on the School resource. Therefore,
 *                    shortening can't take place.
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  getAllEntitiesOfType(metaEd, 'domainEntitySubclass', 'associationSubclass').forEach((entity) => {
    const subclassEntity = entity as TopLevelEntity;
    if (subclassEntity.baseEntity == null) return;

    const superclassEntity: TopLevelEntity = subclassEntity.baseEntity;
    const superclassPrefixedCollectionProperties = superclassEntity.properties.filter(
      (p) => p.fullPropertyName.startsWith(superclassEntity.metaEdName) && p.isCollection,
    );

    subclassEntity.properties
      .filter((p) => p.isCollection)
      .forEach((subclassCollectionProperty) => {
        const subclassPropertyNameSuffix = dropPrefix(
          subclassCollectionProperty.parentEntityName,
          subclassCollectionProperty.fullPropertyName,
        );

        // Set in the subclass -> superclass direction if exists
        const subclassPropertyMeadowlark = subclassCollectionProperty.data.meadowlark as EntityPropertyMeadowlarkData;
        subclassPropertyMeadowlark.namingCollisionWithSuperclassProperty =
          superclassPrefixedCollectionProperties.find(
            (superclassProperty) =>
              dropPrefix(superclassEntity.metaEdName, superclassProperty.fullPropertyName) === subclassPropertyNameSuffix,
          ) ?? NoEntityProperty;

        // Add in the superclass -> subclass direction if exists
        if (subclassPropertyMeadowlark.namingCollisionWithSuperclassProperty !== NoEntityProperty) {
          (
            subclassPropertyMeadowlark.namingCollisionWithSuperclassProperty.data.meadowlark as EntityPropertyMeadowlarkData
          ).namingCollisionWithSubclassProperties.push(subclassCollectionProperty);
        }
      });
  });

  return {
    enhancerName: 'SubclassPropertyNamingCollisionEnhancer',
    success: true,
  };
}

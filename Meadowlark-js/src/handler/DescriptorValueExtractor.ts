// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { TopLevelEntity } from '@edfi/metaed-core';
import { CollectedProperty } from '../metaed/model/CollectedProperty';
import { EntityMeadowlarkData } from '../metaed/model/EntityMeadowlarkData';
import { EntityPropertyMeadowlarkData } from '../metaed/model/EntityPropertyMeadowlarkData';
import { prefixedName } from '../metaed/model/PropertyModifier';
import { topLevelNameOnEntity } from '../metaed/Utility';
import { ReferentialConstraint } from '../model/ReferentialConstraint';

// TODO: The behavior of calculating the body names of descriptors for an entity can be pushed into a
// new MetaEd enhancer, and entity.data.meadowlark.apiMapping.descriptorCollectedProperties
// can be replaced with an array structure with the resolved name, isCollection flag, metaEdType and metaEdName,
// named something like entity.data.meadowlark.apiMapping.descriptorPropertyBodyNames

/**
 * Assumes collectedProperty is a descriptor collection
 */
function extractForDescriptorCollection(
  collectedProperty: CollectedProperty,
  body: object,
  topLevelName: string,
): ReferentialConstraint[] {
  const { apiMapping } = collectedProperty.property.data.meadowlark as EntityPropertyMeadowlarkData;
  const bodyDescriptorArray = body[prefixedName(topLevelName, collectedProperty.propertyModifier)];

  // Handle optional case
  if (bodyDescriptorArray == null) return [];

  return bodyDescriptorArray.map((bodyDescriptorObject) => ({
    metaEdType: apiMapping.metaEdType,
    metaEdName: apiMapping.metaEdName,
    constraintKey: `NK#${
      bodyDescriptorObject[prefixedName(apiMapping.descriptorCollectionName, collectedProperty.propertyModifier)]
    }`,
  }));
}

function extractDescriptorValuesFromBody(
  collectedProperty: CollectedProperty,
  body: object,
  topLevelName: string,
): ReferentialConstraint[] {
  const { apiMapping } = collectedProperty.property.data.meadowlark as EntityPropertyMeadowlarkData;
  if (apiMapping.isDescriptorCollection) return extractForDescriptorCollection(collectedProperty, body, topLevelName);

  const bodyDescriptorName = prefixedName(topLevelName, collectedProperty.propertyModifier);
  // Handle optional case
  if (body[bodyDescriptorName] == null) return [];
  return [
    {
      metaEdType: apiMapping.metaEdType,
      metaEdName: apiMapping.metaEdName,
      isAssignableFrom: false,
      constraintKey: `NK#${body[bodyDescriptorName]}`,
    },
  ];
}

/**
 * Takes a MetaEd entity object and a API JSON body for the resource mapped to that MetaEd entity and
 * extracts the descriptor URI for each descriptor value in the body
 */
export function extractDescriptorValues(entity: TopLevelEntity, body: object): ReferentialConstraint[] {
  const result: ReferentialConstraint[] = [];
  const { descriptorCollectedProperties } = (entity.data.meadowlark as EntityMeadowlarkData).apiMapping;

  descriptorCollectedProperties.forEach((collectedProperty: CollectedProperty) => {
    const topLevelName = topLevelNameOnEntity(entity, collectedProperty.property);
    result.push(...extractDescriptorValuesFromBody(collectedProperty, body, topLevelName));
  });

  return result;
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix, TopLevelEntity } from '@edfi/metaed-core';
import {
  CollectedProperty,
  EntityApiSchemaData,
  EntityPropertyApiSchemaData,
  prefixedName,
  topLevelApiNameOnEntity,
} from '@edfi/metaed-plugin-edfi-api-schema';
import { DocumentReference } from '../model/DocumentReference';

// TODO: The behavior of calculating the body names of descriptors for an entity can be pushed into a
// new MetaEd enhancer, and entity.data.edfiApiSchema.apiMapping.descriptorCollectedApiProperties
// can be replaced with an array structure with the resolved name, isCollection flag, metaEdType and metaEdName,
// named something like entity.data.edfiApiSchema.apiMapping.descriptorPropertyBodyNames

/**
 * Assumes collectedProperty is a descriptor collection
 */
function extractForDescriptorCollection(
  collectedProperty: CollectedProperty,
  body: object,
  topLevelName: string,
): DocumentReference[] {
  const { apiMapping } = collectedProperty.property.data.edfiApiSchema as EntityPropertyApiSchemaData;
  const bodyDescriptorArray =
    body[prefixedName(topLevelName, collectedProperty.property, collectedProperty.propertyModifier)];

  // Handle optional case
  if (bodyDescriptorArray == null) return [];

  return bodyDescriptorArray.map(
    (bodyDescriptorObject) =>
      ({
        projectName: collectedProperty.property.namespace.projectName,
        resourceVersion: collectedProperty.property.namespace.projectVersion,
        resourceName: apiMapping.metaEdName,
        isAssignableFrom: false,
        documentIdentity: {
          descriptor:
            bodyDescriptorObject[
              prefixedName(
                apiMapping.descriptorCollectionName,
                collectedProperty.property,
                collectedProperty.propertyModifier,
              )
            ],
        },

        isDescriptor: true,
      }) as DocumentReference,
  );
}

function extractDescriptorValuesFromBody(
  collectedProperty: CollectedProperty,
  body: object,
  topLevelName: string,
): DocumentReference[] {
  const { apiMapping } = collectedProperty.property.data.edfiApiSchema as EntityPropertyApiSchemaData;
  if (apiMapping.isDescriptorCollection) return extractForDescriptorCollection(collectedProperty, body, topLevelName);

  const bodyDescriptorName = prefixedName(topLevelName, collectedProperty.property, collectedProperty.propertyModifier);
  // Handle optional case
  if (body[bodyDescriptorName] == null) return [];
  return [
    {
      projectName: collectedProperty.property.namespace.projectName,
      resourceName: normalizeDescriptorSuffix(apiMapping.metaEdName),
      documentIdentity: { descriptor: body[bodyDescriptorName] },
      isDescriptor: true,
    },
  ];
}

/**
 * Takes a MetaEd entity object and a API JSON body for the resource mapped to that MetaEd entity and
 * extracts the descriptor URI for each descriptor value in the body
 */
export function extractDescriptorValues(entity: TopLevelEntity, body: object): DocumentReference[] {
  const result: DocumentReference[] = [];
  const { descriptorCollectedApiProperties } = (entity.data.edfiApiSchema as EntityApiSchemaData).apiMapping;

  descriptorCollectedApiProperties.forEach((collectedProperty: CollectedProperty) => {
    const topLevelName = topLevelApiNameOnEntity(entity, collectedProperty.property);
    result.push(...extractDescriptorValuesFromBody(collectedProperty, body, topLevelName));
  });

  return result;
}

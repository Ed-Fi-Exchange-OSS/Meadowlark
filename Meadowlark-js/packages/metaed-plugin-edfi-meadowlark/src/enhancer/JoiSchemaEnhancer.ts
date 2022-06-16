// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// TODO: Need to upgrade to latest joi (https://joi.dev/), which is now top-level and no longer under hapi
import Joi from '@hapi/joi';
import {
  getAllEntitiesOfType,
  MetaEdEnvironment,
  EnhancerResult,
  ReferentialProperty,
  EntityProperty,
  CommonProperty,
  TopLevelEntity,
} from '@edfi/metaed-core';
import { EntityMeadowlarkData } from '../model/EntityMeadowlarkData';
import { EntityPropertyMeadowlarkData } from '../model/EntityPropertyMeadowlarkData';
import { PropertyModifier, prefixedName } from '../model/PropertyModifier';
import { singularize, topLevelNameOnEntity } from '../Utility';

const enhancerName = 'JoiSchemaEnhancer';

// All descriptor documents have the same schema
const descriptorSchema = Joi.object({
  namespace: Joi.string().required(),
  codeValue: Joi.string().required(),
  shortDescription: Joi.string().required(),
  description: Joi.string().optional(),
});

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given referential property.
 */
function joiTypeForReferentialProperty(property: ReferentialProperty, propertyModifier: PropertyModifier) {
  const schemaDefinition: { [key: string]: Joi.AnySchema } = {};
  const referencedEntityApiMapping = (property.referencedEntity.data.meadowlark as EntityMeadowlarkData).apiMapping;

  referencedEntityApiMapping.flattenedIdentityProperties.forEach((ip) => {
    const identityPropertyApiMapping = (ip.data.meadowlark as EntityPropertyMeadowlarkData).apiMapping;
    // eslint-disable-next-line no-use-before-define
    schemaDefinition[prefixedName(identityPropertyApiMapping.fullName, propertyModifier)] = joiTypeAndCardinalityFor(
      ip,
      propertyModifier,
    );
  });
  return Joi.object(schemaDefinition);
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given common property.
 */
function joiTypeForCommonProperty(property: CommonProperty, propertyModifier: PropertyModifier) {
  const schemaDefinition: { [key: string]: Joi.AnySchema } = {};
  const referenceProperties = property.referencedEntity.properties;
  referenceProperties.forEach((rp) => {
    const referencePropertyApiMapping = (rp.data.meadowlark as EntityPropertyMeadowlarkData).apiMapping;
    // eslint-disable-next-line no-use-before-define
    schemaDefinition[prefixedName(referencePropertyApiMapping.fullName, propertyModifier)] = joiTypeAndCardinalityFor(
      rp,
      propertyModifier,
    );
  });
  return Joi.object(schemaDefinition);
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given property.
 */
function joiTypeFor(property: EntityProperty, propertyModifier: PropertyModifier): Joi.AnySchema {
  let result: Joi.AnySchema = Joi.any();

  switch (property.type) {
    case 'association':
    case 'domainEntity':
      result = joiTypeForReferentialProperty(property as ReferentialProperty, propertyModifier);
      break;
    case 'boolean':
      result = Joi.boolean();
      break;
    case 'choice':
      break;
    case 'common':
      result = joiTypeForCommonProperty(property as CommonProperty, propertyModifier);
      break;
    case 'currency':
      result = Joi.number().strict();
      break;
    case 'date':
      result = Joi.date();
      break;
    case 'datetime':
      result = Joi.date();
      break;
    case 'decimal':
      result = Joi.number().strict();
      break;
    case 'descriptor':
      result = Joi.string();
      break;
    case 'duration':
      result = Joi.number().strict();
      break;
    case 'enumeration':
      result = Joi.string();
      break;
    case 'inlineCommon':
      break;
    case 'integer':
      result = Joi.number().strict();
      break;
    case 'percent':
      result = Joi.number().strict();
      break;
    case 'schoolYearEnumeration':
      result = Joi.number().min(1900).max(2100).strict();
      break;
    case 'sharedDecimal':
      result = Joi.number().strict();
      break;
    case 'sharedInteger':
      result = Joi.number().strict();
      break;
    case 'sharedShort':
      result = Joi.number().strict();
      break;
    case 'sharedString':
      result = Joi.string();
      break;
    case 'short':
      result = Joi.number().strict();
      break;
    case 'string':
      result = Joi.string();
      break;
    case 'time':
      result = Joi.string();
      break;
    case 'year':
      result = Joi.number().strict();
      break;
    default:
  }

  return result;
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given reference collection property.
 */
function joiTypeForReferenceCollection(property: EntityProperty, propertyModifier: PropertyModifier): Joi.AnySchema {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  const referenceShape = Joi.object().keys({
    [prefixedName(apiMapping.referenceCollectionName, propertyModifier)]: joiTypeForReferentialProperty(
      property as ReferentialProperty,
      {
        ...propertyModifier,
        parentPrefixes: [], // reset prefixes inside the reference
      },
    ).required(),
  });
  const arrayOfReferences = Joi.array().items(referenceShape);
  return property.isRequiredCollection && !propertyModifier.optionalDueToParent
    ? arrayOfReferences.required()
    : arrayOfReferences.optional();
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given descriptor collection property.
 */
function joiTypeForDescriptorCollection(property: EntityProperty, propertyModifier: PropertyModifier): Joi.AnySchema {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  const referenceShape = Joi.object().keys({
    [prefixedName(apiMapping.descriptorCollectionName, propertyModifier)]: Joi.string().required(),
  });
  const arrayOfReferences = Joi.array().items(referenceShape);
  return property.isRequiredCollection && !propertyModifier.optionalDueToParent
    ? arrayOfReferences.required()
    : arrayOfReferences.optional();
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given collection property.
 */
function joiArrayFor(property: EntityProperty, propertyModifier: PropertyModifier): Joi.AnySchema {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  return Joi.array().items(
    Joi.object({
      [singularize(prefixedName(apiMapping.fullName, propertyModifier))]: joiTypeFor(property, propertyModifier),
    }),
  );
}

/**
 * Returns a Joi schema fragment that specifies the type and cardinality of the API body element
 * corresponding to the given property, with possible modifications
 */
function joiTypeAndCardinalityFor(property: EntityProperty, propertyModifier: PropertyModifier): Joi.AnySchema {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  if (apiMapping.isReferenceCollection) return joiTypeForReferenceCollection(property, propertyModifier);
  if (apiMapping.isDescriptorCollection) return joiTypeForDescriptorCollection(property, propertyModifier);
  if (property.isRequiredCollection && !propertyModifier.optionalDueToParent)
    return joiArrayFor(property, propertyModifier).required();
  if ((property.isRequiredCollection && propertyModifier.optionalDueToParent) || property.isOptionalCollection)
    return joiArrayFor(property, propertyModifier).optional();
  if ((property.isRequired || property.isPartOfIdentity) && !propertyModifier.optionalDueToParent)
    return joiTypeFor(property, propertyModifier).required();
  return joiTypeFor(property, propertyModifier).optional();
}

/**
 * Builds an API JSON document Joi schema that corresponds to a given MetaEd entity.
 */
function buildJoiSchema(entityForSchema: TopLevelEntity): Joi.AnySchema {
  const schemaDefinition: { [key: string]: Joi.AnySchema } = {};
  const { collectedProperties } = entityForSchema.data.meadowlark as EntityMeadowlarkData;

  collectedProperties.forEach(({ property, propertyModifier }) => {
    const topLevelName = topLevelNameOnEntity(entityForSchema, property);
    const schemaObjectBaseName = prefixedName(topLevelName, propertyModifier);
    schemaDefinition[schemaObjectBaseName] = joiTypeAndCardinalityFor(property, propertyModifier);
  });

  return Joi.object(schemaDefinition);
}

/**
 * This enhancer uses the results of the ApiMappingEnhancer to create a Joi (https://joi.dev/)
 * schema for each MetaEd entity. This schema is used to validate the API JSON document body
 * shape for each resource that corresponds to the MetaEd entity.
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  // Build schemas for each domain entity and association
  getAllEntitiesOfType(metaEd, 'domainEntity', 'association', 'domainEntitySubclass', 'associationSubclass').forEach(
    (entity) => {
      const entityMeadowlarkData = entity.data.meadowlark as EntityMeadowlarkData;
      entityMeadowlarkData.joiSchema = buildJoiSchema(entity as TopLevelEntity);
    },
  );

  // Attach descriptor schema to each descriptor
  getAllEntitiesOfType(metaEd, 'descriptor').forEach((entity) => {
    const entityMeadowlarkData = entity.data.meadowlark as EntityMeadowlarkData;
    entityMeadowlarkData.joiSchema = descriptorSchema;
  });

  return {
    enhancerName,
    success: true,
  };
}

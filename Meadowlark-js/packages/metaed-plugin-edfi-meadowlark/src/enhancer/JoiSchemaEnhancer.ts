// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-use-before-define */

// TODO: RND-67 Replace Joi with JSON Schema
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

// SchoolYearEnumeration is a hardcoded exception in the ODS/API
const schoolYearEnumerationSchema = Joi.object({
  schoolYear: Joi.number().min(1900).max(2100).strict(),
  currentSchoolYear: Joi.boolean().required(),
  schoolYearDescription: Joi.string().optional(),
});

/**
 * Returns a new PropertyModifier that is the concatenation of two. Used for Commons and sub-Commons,
 * where there is a chain of parent modifiers that cannot be completely pre-computed
 * (without a different design, like pre-computing all possible paths).
 */
function propertyModifierConcat(p1: PropertyModifier, p2: PropertyModifier): PropertyModifier {
  return {
    optionalDueToParent: p1.optionalDueToParent || p2.optionalDueToParent,
    parentPrefixes: [...p1.parentPrefixes, ...p2.parentPrefixes],
  };
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given referential property.
 */
function joiTypeForReferentialProperty(property: ReferentialProperty, propertyModifier: PropertyModifier) {
  const schemaDefinition: { [key: string]: Joi.AnySchema } = {};
  const referencedEntityApiMapping = (property.referencedEntity.data.meadowlark as EntityMeadowlarkData).apiMapping;

  referencedEntityApiMapping.flattenedIdentityProperties.forEach((ip) => {
    const identityPropertyApiMapping = (ip.data.meadowlark as EntityPropertyMeadowlarkData).apiMapping;
    schemaDefinition[prefixedName(identityPropertyApiMapping.fullName, propertyModifier)] = joiTypeAndCardinalityFor(
      ip,
      propertyModifier,
    );
  });
  return Joi.object(schemaDefinition);
}

/**
 * Returns a Joi schema of the properties of a referenced Common entity, handling issues of parent naming,
 * and choice/inline common property pull-up
 */
function schemaFromPropertiesOfCommon(property: CommonProperty, propertyModifier: PropertyModifier) {
  const schemaDefinition: { [key: string]: Joi.AnySchema } = {};
  const { collectedProperties } = property.referencedEntity.data.meadowlark as EntityMeadowlarkData;

  collectedProperties.forEach((collectedProperty) => {
    const concatenatedPropertyModifier: PropertyModifier = propertyModifierConcat(
      propertyModifier,
      collectedProperty.propertyModifier,
    );

    const referencePropertyApiMapping = (collectedProperty.property.data.meadowlark as EntityPropertyMeadowlarkData)
      .apiMapping;

    schemaDefinition[prefixedName(referencePropertyApiMapping.topLevelName, concatenatedPropertyModifier)] =
      joiTypeAndCardinalityFor(collectedProperty.property, concatenatedPropertyModifier);
  });
  return schemaDefinition;
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given scalar common property.
 */
function joiTypeForScalarCommonProperty(property: CommonProperty, propertyModifier: PropertyModifier) {
  const schemaDefinition: { [key: string]: Joi.AnySchema } = schemaFromPropertiesOfCommon(property, propertyModifier);
  return Joi.object(schemaDefinition);
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given common collection property.
 */
function joiTypeForCommonCollection(property: CommonProperty, propertyModifier: PropertyModifier): Joi.AnySchema {
  const schemaDefinition: { [key: string]: Joi.AnySchema } = schemaFromPropertiesOfCommon(property, propertyModifier);

  const arrayOfReferences = Joi.array().min(1).items(schemaDefinition);
  return property.isRequiredCollection && !propertyModifier.optionalDueToParent
    ? arrayOfReferences.required()
    : arrayOfReferences.optional();
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
      result = joiTypeForScalarCommonProperty(property as CommonProperty, propertyModifier);
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
  const arrayOfReferences = Joi.array().min(1).items(referenceShape);
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
  const arrayOfReferences = Joi.array().min(1).items(referenceShape);
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
  return Joi.array()
    .min(1)
    .items(
      Joi.object({
        [singularize(prefixedName(apiMapping.fullName, propertyModifier))]: joiTypeFor(property, propertyModifier),
      }),
    );
}

/**
 * Returns a Joi schema fragment that specifies the API body element shape
 * corresponding to the given school year enumeration.
 */
function joiTypeForSchoolYearEnumeration(property: EntityProperty, propertyModifier: PropertyModifier): Joi.AnySchema {
  // We ignore whether this is a collection because there are no collections of school year in the DS,
  // so the shape of a school year collection is unknown.
  const result = Joi.object().keys({
    schoolYear: Joi.number().min(1900).max(2100).required(),
  });

  return property.isRequired && !propertyModifier.optionalDueToParent ? result.required() : result.optional();
}

/**
 * Returns a Joi schema fragment that specifies the type and cardinality of the API body element
 * corresponding to the given property, with possible modifications
 */
function joiTypeAndCardinalityFor(property: EntityProperty, propertyModifier: PropertyModifier): Joi.AnySchema {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  if (apiMapping.isReferenceCollection) return joiTypeForReferenceCollection(property, propertyModifier);
  if (apiMapping.isDescriptorCollection) return joiTypeForDescriptorCollection(property, propertyModifier);
  if (apiMapping.isCommonCollection) return joiTypeForCommonCollection(property as CommonProperty, propertyModifier);
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
    if (property.type === 'schoolYearEnumeration') {
      // School year enumerations act like entities with a "schoolYear" property in the ODS/API, but do not have them in the model
      schemaDefinition[schemaObjectBaseName] = joiTypeForSchoolYearEnumeration(property, propertyModifier);
    } else {
      schemaDefinition[schemaObjectBaseName] = joiTypeAndCardinalityFor(property, propertyModifier);
    }
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

  // Attach school year enumeration schema
  getAllEntitiesOfType(metaEd, 'schoolYearEnumeration').forEach((entity) => {
    const entityMeadowlarkData = entity.data.meadowlark as EntityMeadowlarkData;
    entityMeadowlarkData.joiSchema = schoolYearEnumerationSchema;
  });

  return {
    enhancerName,
    success: true,
  };
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-use-before-define */

import {
  getAllEntitiesOfType,
  MetaEdEnvironment,
  EnhancerResult,
  ReferentialProperty,
  EntityProperty,
  CommonProperty,
  TopLevelEntity,
  StringProperty,
  IntegerProperty,
  ShortProperty,
} from '@edfi/metaed-core';
import { getBooleanFromEnvironment, getIntegerFromEnvironment } from '@edfi/meadowlark-utilities';
import { invariant } from 'ts-invariant';
import type { EntityMeadowlarkData } from '../model/EntityMeadowlarkData';
import type { EntityPropertyMeadowlarkData } from '../model/EntityPropertyMeadowlarkData';
import {
  newSchemaRoot,
  NoSchemaProperty,
  SchemaArray,
  SchemaObject,
  SchemaProperties,
  SchemaProperty,
  SchemaRoot,
} from '../model/JsonSchema';
import { PropertyModifier, prefixedName } from '../model/PropertyModifier';
import { singularize, topLevelNameOnEntity } from '../Utility';

const enhancerName = 'JsonSchemaEnhancer';

// All descriptor documents have the same schema
const descriptorSchema: SchemaRoot = {
  ...newSchemaRoot(),
  type: 'object',
  title: 'EdFi.Descriptor',
  description: 'An Ed-Fi Descriptor',
  properties: {
    id: {
      type: 'string',
      description: 'The item documentUuid.',
    },
    namespace: {
      type: 'string',
      description: 'The descriptor namespace as a URI',
    },
    codeValue: {
      type: 'string',
      description: 'The descriptor code value',
    },
    shortDescription: {
      type: 'string',
      description: 'The descriptor short description',
    },
    description: {
      type: 'string',
      description: 'The descriptor description',
    },
  },
  additionalProperties: false,
  required: ['namespace', 'codeValue', 'shortDescription'],
};

// SchoolYearEnumeration is a hardcoded exception in the ODS/API
const beginYear = getIntegerFromEnvironment('BEGIN_ALLOWED_SCHOOL_YEAR', 1900);
const endYear = getIntegerFromEnvironment('END_ALLOWED_SCHOOL_YEAR', 2100);

const schoolYear: SchemaProperty = {
  type: 'integer',
  description: `A school year between ${beginYear} and ${endYear}`,
  minimum: beginYear,
  maximum: endYear,
};

const schoolYearEnumerationSchema: SchemaRoot = {
  ...newSchemaRoot(),
  type: 'object',
  title: 'EdFi.SchoolYearType',
  description: 'A school year enumeration',
  properties: {
    schoolYear,
  },
  additionalProperties: false,
};

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
 * Wraps a set of schema properties and required field names with a schema object
 */
function schemaObjectFrom(schemaProperties: SchemaProperties, required: string[]): SchemaObject {
  const result: SchemaProperty = {
    type: 'object',
    properties: schemaProperties,
    additionalProperties: false,
  };

  if (required.length > 0) {
    result.required = required;
  }
  return result;
}

/**
 * Wraps a schema property in a schema array
 */
function schemaArrayFrom(schemaArrayElement: SchemaProperty): SchemaArray {
  return {
    type: 'array',
    items: schemaArrayElement,
    minItems: 0,
    uniqueItems: false,
  };
}

/**
 * Determines whether the schema property for this entity property is required
 */
function isSchemaPropertyRequired(property: EntityProperty, propertyModifier: PropertyModifier): boolean {
  return (
    (property.isRequired || property.isRequiredCollection || property.isPartOfIdentity) &&
    !propertyModifier.optionalDueToParent
  );
}

/**
 * Returns a JSON schema fragment that specifies the API body element shape
 * corresponding to the given referential property.
 */
function schemaObjectForReferentialProperty(
  property: ReferentialProperty,
  propertyModifier: PropertyModifier,
): SchemaObject {
  const schemaProperties: SchemaProperties = {};
  const required: Set<string> = new Set();

  const referencedEntityApiMapping = (property.referencedEntity.data.meadowlark as EntityMeadowlarkData).apiMapping;

  referencedEntityApiMapping.flattenedIdentityProperties.forEach((identityProperty) => {
    const identityPropertyApiMapping = (identityProperty.data.meadowlark as EntityPropertyMeadowlarkData).apiMapping;
    const schemaPropertyName: string = prefixedName(identityPropertyApiMapping.fullName, propertyModifier);

    const schemaProperty: SchemaProperty = schemaPropertyFor(identityProperty, propertyModifier);

    // Note that this key/value usage of Object implictly merges by overwrite if there is more than one scalar property
    // with the same name sourced from different identity reference properties. There is no need to check
    // properties for merge directive annotations because MetaEd has already validated merges and any scalar identity
    // property name duplication _must_ be a merge.
    schemaProperties[schemaPropertyName] = schemaProperty;

    if (isSchemaPropertyRequired(identityProperty, propertyModifier)) {
      // As above, this usage of Set this implictly merges by overwrite
      required.add(schemaPropertyName);
    }
  });

  return schemaObjectFrom(schemaProperties, Array.from(required.values()));
}

/**
 * Returns a JSON schema fragment that specifies the API body element shape
 * corresponding to the given scalar common property.
 */
function schemaObjectForScalarCommonProperty(property: CommonProperty, propertyModifier: PropertyModifier): SchemaObject {
  const schemaProperties: SchemaProperties = {};
  const required: string[] = [];

  const { collectedProperties } = property.referencedEntity.data.meadowlark as EntityMeadowlarkData;

  collectedProperties.forEach((collectedProperty) => {
    const concatenatedPropertyModifier: PropertyModifier = propertyModifierConcat(
      propertyModifier,
      collectedProperty.propertyModifier,
    );

    const referencePropertyApiMapping = (collectedProperty.property.data.meadowlark as EntityPropertyMeadowlarkData)
      .apiMapping;
    const schemaPropertyName: string = prefixedName(referencePropertyApiMapping.topLevelName, concatenatedPropertyModifier);

    const schemaProperty: SchemaProperty = schemaPropertyFor(collectedProperty.property, concatenatedPropertyModifier);

    schemaProperties[schemaPropertyName] = schemaProperty;
    if (isSchemaPropertyRequired(collectedProperty.property, concatenatedPropertyModifier)) {
      required.push(schemaPropertyName);
    }
  });
  return schemaObjectFrom(schemaProperties, required);
}

/**
 * Returns a JSON schema fragment that specifies the API body element shape
 * corresponding to the given property.
 */
function schemaPropertyForNonReference(property: EntityProperty): SchemaProperty {
  invariant(property.type !== 'association' && property.type !== 'common' && property.type !== 'domainEntity');

  const description: string = property.documentation;

  switch (property.type) {
    case 'boolean':
      return { type: 'boolean', description };

    case 'currency':
    case 'decimal':
    case 'duration':
    case 'percent':
    case 'sharedDecimal':
      return { type: 'number', description };

    case 'date':
      return { type: 'string', format: 'date', description };

    case 'datetime':
      return { type: 'string', format: 'date-time', description };

    case 'descriptor':
    case 'enumeration':
      return { type: 'string', description };

    case 'integer':
    case 'sharedInteger': {
      const result: SchemaProperty = { type: 'integer', description };
      const integerProperty: IntegerProperty = property as IntegerProperty;
      if (integerProperty.minValue) result.minimum = Number(integerProperty.minValue);
      if (integerProperty.maxValue) result.maximum = Number(integerProperty.maxValue);
      return result;
    }

    case 'short':
    case 'sharedShort': {
      const result: SchemaProperty = { type: 'integer', description };
      const shortProperty: ShortProperty = property as ShortProperty;
      if (shortProperty.minValue) result.minimum = Number(shortProperty.minValue);
      if (shortProperty.maxValue) result.maximum = Number(shortProperty.maxValue);
      return result;
    }

    case 'string':
    case 'sharedString': {
      const result: SchemaProperty = { type: 'string', description };
      const stringProperty: StringProperty = property as StringProperty;
      if (stringProperty.minLength) result.minLength = Number(stringProperty.minLength);
      if (stringProperty.maxLength) result.maxLength = Number(stringProperty.maxLength);
      return result;
    }

    case 'time':
      return { type: 'string', format: 'time', description };

    case 'schoolYearEnumeration':
      if (property.parentEntity.type === 'common') {
        // For a common, the school year ends up being nested under a reference object
        return schoolYearEnumerationSchema;
      }

      return schoolYear;

    case 'year':
      return { type: 'integer', description };

    case 'choice':
    case 'inlineCommon':
    default:
      return NoSchemaProperty;
  }
}

/**
 * Returns a JSON schema fragment that specifies the API body element shape
 * corresponding to the given reference collection property.
 */
function schemaArrayForReferenceCollection(property: EntityProperty, propertyModifier: PropertyModifier): SchemaArray {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  const referenceName = prefixedName(apiMapping.referenceCollectionName, propertyModifier);

  const referenceSchemaObject: SchemaObject = schemaObjectForReferentialProperty(property as ReferentialProperty, {
    ...propertyModifier,
    parentPrefixes: [], // reset prefixes inside the reference
  });

  const referenceArrayElement: SchemaObject = schemaObjectFrom({ [referenceName]: referenceSchemaObject }, [referenceName]);

  return {
    ...schemaArrayFrom(referenceArrayElement),
    minItems: isSchemaPropertyRequired(property, propertyModifier) ? 1 : 0,
  };
}

/**
 * Returns a JSON schema fragment that specifies the API body element shape
 * corresponding to the given descriptor collection property.
 */
function schemaArrayForDescriptorCollection(property: EntityProperty, propertyModifier: PropertyModifier): SchemaArray {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  const descriptorName = prefixedName(apiMapping.descriptorCollectionName, propertyModifier);

  const descriptorSchemaProperty: { [key: string]: SchemaProperty } = {
    [descriptorName]: { type: 'string', description: 'An Ed-Fi Descriptor' },
  };

  return {
    ...schemaArrayFrom(schemaObjectFrom(descriptorSchemaProperty, [descriptorName])),
    minItems: isSchemaPropertyRequired(property, propertyModifier) ? 1 : 0,
  };
}

/**
 * Returns a JSON schema fragment that specifies the API body element shape
 * corresponding to the given non-reference collection property.
 */
function schemaArrayForNonReferenceCollection(property: EntityProperty, propertyModifier: PropertyModifier): SchemaArray {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;
  const propertyName = singularize(prefixedName(apiMapping.fullName, propertyModifier));

  const schemaProperty: { [key: string]: SchemaProperty } = {
    [propertyName]: schemaPropertyForNonReference(property),
  };

  return {
    ...schemaArrayFrom(schemaObjectFrom(schemaProperty, [propertyName])),
    minItems: isSchemaPropertyRequired(property, propertyModifier) ? 1 : 0,
  };
}

/**
 * Returns a JSON schema fragment that specifies the API body shape
 * corresponding to a given school year enumeration reference.
 */
function schemaPropertyForSchoolYearEnumeration(property: EntityProperty): SchemaProperty {
  invariant(property.type === 'schoolYearEnumeration');
  // Assume not a collection, the shape of a school year collection is currently undefined by the ODS/API
  return schoolYearEnumerationSchema;
}

/**
 * Returns a schema fragment that specifies the schema property of the API body element
 * corresponding to the given property
 */
function schemaPropertyFor(property: EntityProperty, propertyModifier: PropertyModifier): SchemaProperty {
  const { apiMapping } = property.data.meadowlark as EntityPropertyMeadowlarkData;

  if (apiMapping.isReferenceCollection) {
    return schemaArrayForReferenceCollection(property, propertyModifier);
  }
  if (apiMapping.isScalarReference) {
    return schemaObjectForReferentialProperty(property as ReferentialProperty, propertyModifier);
  }
  if (apiMapping.isDescriptorCollection) {
    return schemaArrayForDescriptorCollection(property, propertyModifier);
  }
  if (apiMapping.isCommonCollection) {
    return schemaArrayFrom(schemaObjectForScalarCommonProperty(property as CommonProperty, propertyModifier));
  }
  if (apiMapping.isScalarCommon) {
    return schemaObjectForScalarCommonProperty(property as CommonProperty, propertyModifier);
  }
  if (property.isRequiredCollection || property.isOptionalCollection) {
    return schemaArrayForNonReferenceCollection(property, propertyModifier);
  }
  return schemaPropertyForNonReference(property);
}

/**
 * Adds a property name to the schema object's required field if required, creating the field if necessary.
 */
function addRequired(isRequired: boolean, schemaObject: SchemaObject, schemaPropertyName: string): void {
  if (!isRequired) return;
  if (schemaObject.required == null) {
    schemaObject.required = [];
  }
  schemaObject.required.push(schemaPropertyName);
}

/**
 * Builds an API JSON document schema that corresponds to a given MetaEd entity.
 */
function buildJsonSchema(entityForSchema: TopLevelEntity): SchemaRoot {
  const schemaRoot: SchemaRoot = {
    ...newSchemaRoot(),
    type: 'object',
    title: `${entityForSchema.namespace.projectName}.${entityForSchema.metaEdName}`,
    description: entityForSchema.documentation,
    properties: {},
    additionalProperties: false,
  };

  const { collectedProperties } = entityForSchema.data.meadowlark as EntityMeadowlarkData;

  collectedProperties.forEach(({ property, propertyModifier }) => {
    const topLevelName = topLevelNameOnEntity(entityForSchema, property);
    const schemaObjectBaseName = prefixedName(topLevelName, propertyModifier);

    const schemaProperty: SchemaProperty =
      property.type === 'schoolYearEnumeration'
        ? schemaPropertyForSchoolYearEnumeration(property)
        : schemaPropertyFor(property, propertyModifier);

    schemaRoot.properties[schemaObjectBaseName] = schemaProperty;
    addRequired(isSchemaPropertyRequired(property, propertyModifier), schemaRoot, schemaObjectBaseName);
  });

  if (getBooleanFromEnvironment('ALLOW__EXT_PROPERTY', false)) {
    // eslint-disable-next-line no-underscore-dangle
    schemaRoot.properties._ext = {
      description: 'optional extension collection',
      type: 'object',
      properties: {},
      additionalProperties: true,
    };
  }

  return schemaRoot;
}

/**
 * This enhancer uses the results of the ApiMappingEnhancer to create a JSON schema
 * for each MetaEd entity. This schema is used to validate the API JSON document body
 * shape for each resource that corresponds to the MetaEd entity.
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  // Build schemas for each domain entity and association
  getAllEntitiesOfType(metaEd, 'domainEntity', 'association', 'domainEntitySubclass', 'associationSubclass').forEach(
    (entity) => {
      const entityMeadowlarkData = entity.data.meadowlark as EntityMeadowlarkData;
      entityMeadowlarkData.jsonSchema = buildJsonSchema(entity as TopLevelEntity);
    },
  );

  // Attach descriptor schema to each descriptor
  getAllEntitiesOfType(metaEd, 'descriptor').forEach((entity) => {
    const entityMeadowlarkData = entity.data.meadowlark as EntityMeadowlarkData;
    entityMeadowlarkData.jsonSchema = descriptorSchema;
  });

  // Attach school year enumeration schema
  getAllEntitiesOfType(metaEd, 'schoolYearEnumeration').forEach((entity) => {
    const entityMeadowlarkData = entity.data.meadowlark as EntityMeadowlarkData;
    entityMeadowlarkData.jsonSchema = schoolYearEnumerationSchema;
  });

  return {
    enhancerName,
    success: true,
  };
}

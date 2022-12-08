// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-use-before-define */

/**
 * The set of properties on a SchemaObject.
 */
export type SchemaProperties = { [propertyName: string]: SchemaProperty };

/**
 * SchemaObject is the SchemaProperty representing an object, which has properties
 */
export type SchemaObject = {
  type: 'object';
  description?: string;
  properties: SchemaProperties;
  additionalProperties: boolean;
  required?: string[];
};

/**
 * SchemaArray is the SchemaProperty representing an array, which has items
 */
export type SchemaArray = {
  type: 'array';
  description?: string;
  items: SchemaProperty;
  minItems: number;
  uniqueItems: false;
};

/**
 * SchemaProperty is either an object, array, or simple type
 */
export type SchemaProperty =
  | SchemaObject
  | SchemaArray
  | { type: 'string'; description: string; format?: 'date' | 'date-time' | 'time'; minLength?: number; maxLength?: number }
  | { type: 'integer'; description: string; minimum?: number; maximum?: number }
  | { type: 'number'; description: string; minimum?: number; maximum?: number }
  | { type: 'boolean'; description: string };

/**
 * The null object SchemaProperty
 */
export const NoSchemaProperty: SchemaProperty = Object.freeze({
  type: 'boolean',
  description: 'NoSchemaProperty',
});

/**
 * A SchemaRoot is a SchemaObject with additional header fields
 */
export type SchemaRoot = SchemaObject & {
  $schema: string;
  title: string;
};

/**
 * Creates a default SchemaRoot
 */
export function newSchemaRoot(): SchemaRoot {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: '',
    description: '',
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
}

/**
 * The null object SchemaRoot
 */
export const NoSchemaRoot: SchemaRoot = Object.freeze({
  ...newSchemaRoot(),
  title: 'NoSchemaRoot',
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-use-before-define */ // Due to recursive references

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
 * A SchemaRoot is a SchemaObject with additional header fields
 */
export type SchemaRoot = SchemaObject & {
  $schema: string;
  title: string;
};

/**
 * The SchemaRoot null object
 */
export const NoSchemaRoot: SchemaRoot = Object.freeze({
  type: 'object',
  properties: {},
  additionalProperties: false,
  $schema: '',
  title: 'NoSchemaRoot',
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-underscore-dangle */

type SchemaProperty = {
  name: string;
  presence: string;
  type: string;
};

export function expectSubschemas(joiSchema: any, schemaProperties: SchemaProperty[]): any[] {
  const subschemas: any[] = [...joiSchema._ids._byKey.values()];
  if (subschemas.length !== schemaProperties.length) throw new Error('schema property length wrong');
  subschemas.forEach((subschema, index) => {
    expect(subschema.id).toBe(schemaProperties[index].name);
    expect(subschema.schema._flags.presence).toBe(schemaProperties[index].presence);
    expect(subschema.schema.type).toBe(schemaProperties[index].type);
  });
  return subschemas.map((s) => s.schema);
}

export function expectSubschemaReferenceArray(joiSchema: any, schemaProperty: SchemaProperty) {
  const subschema: any = [...joiSchema.$_terms.items[0]._ids._byKey.values()][0];
  expect(subschema.id).toBe(schemaProperty.name);
  expect(subschema.schema._flags.presence).toBe(schemaProperty.presence);
  expect(subschema.schema.type).toBe(schemaProperty.type);
  return subschema.schema;
}

export function expectSubschemaScalarArray(joiSchema: any, schemaProperty: SchemaProperty) {
  const subschema: any = [...joiSchema.$_terms.items[0]._ids._byKey.values()][0];
  expect(subschema.id).toBe(schemaProperty.name);
  expect(subschema.schema._flags.presence).toBeUndefined();
  expect(subschema.schema.type).toBe(schemaProperty.type);
  return subschema.schema;
}

export function expectSubschemaArray(joiSchema: any, schemaProperties: SchemaProperty[]) {
  const subschemas: any[] = [...joiSchema.$_terms.items[0]._ids._byKey.values()];
  if (subschemas.length !== schemaProperties.length) throw new Error('schema property length wrong');
  subschemas.forEach((subschema, index) => {
    expect(subschema.id).toBe(schemaProperties[index].name);
    expect(subschema.schema._flags.presence).toBe(schemaProperties[index].presence);
    expect(subschema.schema.type).toBe(schemaProperties[index].type);
  });
  return subschemas.map((s) => s.schema);
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendQueryParameters } from '../../src/handler/FrontendRequest';
import { validateQueryString } from '../../src/validation/QueryStringValidator';
import { ResourceSchema, newResourceSchema } from '../../src/model/api-schema/ResourceSchema';

const resourceSchema: ResourceSchema = {
  ...newResourceSchema(),
  jsonSchemaForQuery: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    additionalProperties: false,
    description: 'doc',
    properties: {
      uniqueId: {
        description: 'doc',
        maxLength: 30,
        type: 'string',
      },
      name: {
        description: 'doc',
        maxLength: 50,
        type: 'string',
      },
      age: {
        description: 'doc',
        type: 'integer',
      },
    },
    title: 'EdFi.Student',
    type: 'object',
  },
};

describe('when validating a querystring', () => {
  describe('given a valid querystring in the URL', () => {
    it.each([
      {}, // Empty query string
      { uniqueId: 'a' }, // One attribute
      {
        uniqueId: 'a',
        name: 'b',
      }, // Two attributes
      {
        age: 13,
      }, // "numeric" age; does not include the "required" uniqueId
    ])('accepts querystring %s', async (queryStrings: FrontendQueryParameters) => {
      const result = await validateQueryString(queryStrings, resourceSchema);
      expect(result).toEqual({});
    });
  });

  describe('given an invalid property', () => {
    it('responds with an error', async () => {
      const result = await validateQueryString({ another: 'property' }, resourceSchema);
      // Don't confirm exact structure at this time.
      expect(result).toHaveProperty('errorBody');
    });
  });

  describe('given there are special characters in the URL', () => {
    it.each([
      { "unique'Id": 'a' },
      { 'unique@Id': 'a' },
      { 'unique(Id': 'a' },
      { 'unique%27Id%27': 'a' },
      { age: '(13' },
      { age: "'13'" },
      { age: '%2730%27' },
    ])('responds to %s with an error', async (queryStrings: FrontendQueryParameters) => {
      const result = await validateQueryString(queryStrings, resourceSchema);
      // Don't confirm exact structure at this time.
      expect(result).toHaveProperty('errorBody');
    });
  });
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { newEntityProperty, newTopLevelEntity, TopLevelEntity } from '@edfi/metaed-core';
import { FrontendQueryParameters } from '../../src/handler/FrontendRequest';
import { validateQueryString } from '../../src/validation/QueryStringValidator';

const createModel = (): TopLevelEntity => ({
  ...newTopLevelEntity(),
  metaEdName: 'Student',
  properties: [{ ...newEntityProperty(), metaEdName: 'uniqueId', isPartOfIdentity: true }],
  data: {
    edfiApiSchema: {
      jsonSchemaForInsert: {
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
        required: ['uniqueId'],
        title: 'EdFi.Student',
        type: 'object',
      },
      jsonSchemaForUpdate: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        description: 'doc',
        properties: {
          id: {
            description: 'The item id',
            type: 'string',
          },
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
        required: ['id', 'uniqueId'],
        title: 'EdFi.Student',
        type: 'object',
      },
    },
  },
});

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
      const result = await validateQueryString(queryStrings, createModel());
      expect(result).toEqual({});
    });
  });

  describe('given an invalid property', () => {
    it('responds with an error', async () => {
      const result = await validateQueryString({ another: 'property' }, createModel());
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
      const result = await validateQueryString(queryStrings, createModel());
      // Don't confirm exact structure at this time.
      expect(result).toHaveProperty('errorBody');
    });
  });
});

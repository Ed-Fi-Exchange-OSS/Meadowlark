// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { newEntityProperty, newTopLevelEntity, TopLevelEntity } from '@edfi/metaed-core';
import { ResourceInfo, newResourceInfo } from '../../src/model/ResourceInfo';
import { DocumentInfo } from '../../src/model/DocumentInfo';
import { DescriptorDocument } from '../../src/model/DescriptorDocument';
import { extractDocumentInfo } from '../../src/extraction/DocumentInfoExtractor';
import { DocumentIdentity } from '../../src/model/DocumentIdentity';

const requestTimestamp = 10;

const testModel = (): TopLevelEntity => ({
  ...newTopLevelEntity(),
  metaEdName: 'Student',
  properties: [
    { ...newEntityProperty(), metaEdName: 'uniqueId', isPartOfIdentity: true },
    { ...newEntityProperty(), metaEdName: 'someBooleanParameter', isPartOfIdentity: false },
    { ...newEntityProperty(), metaEdName: 'someIntegerParameter', isPartOfIdentity: false },
    { ...newEntityProperty(), metaEdName: 'someDecimalParameter', isPartOfIdentity: false },
  ],
  data: {
    edfiApiSchema: {
      apiMapping: {
        identityReferenceComponents: [],
        referenceGroups: [],
        descriptorCollectedApiProperties: [],
      },
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
          someBooleanParameter: {
            description: 'doc',
            type: 'boolean',
          },
          someIntegerParameter: {
            description: 'doc',
            type: 'integer',
          },
          someDecimalParameter: {
            description: 'doc',
            type: 'number',
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
          uniqueId: {
            description: 'doc',
            maxLength: 30,
            type: 'string',
          },
          someBooleanParameter: {
            description: 'doc',
            type: 'boolean',
          },
          someIntegerParameter: {
            description: 'doc',
            type: 'integer',
          },
          someDecimalParameter: {
            description: 'doc',
            type: 'number',
          },
        },
        required: ['uniqueId'],
        title: 'EdFi.Student',
        type: 'object',
      },
    },
  },
});

const testSchoolModel = (): TopLevelEntity => ({
  ...newTopLevelEntity(),
  metaEdName: 'Student',
  properties: [
    { ...newEntityProperty(), metaEdName: 'uniqueId', isPartOfIdentity: true },
    { ...newEntityProperty(), metaEdName: 'someBooleanParameter', isPartOfIdentity: false },
    { ...newEntityProperty(), metaEdName: 'someIntegerParameter', isPartOfIdentity: false },
    { ...newEntityProperty(), metaEdName: 'someDecimalParameter', isPartOfIdentity: false },
  ],
  data: {
    edfiApiSchema: {
      apiMapping: {
        identityReferenceComponents: [],
        referenceGroups: [],
        descriptorCollectedApiProperties: [],
        superclass: {
          metaEdName: 'School',
          documentIdentity: { schoolYear: '2023' },
          namespace: {
            projectName: 'Testing',
          },
          resourceName: 'School',
        },
      },
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
          someBooleanParameter: {
            description: 'doc',
            type: 'boolean',
          },
          someIntegerParameter: {
            description: 'doc',
            type: 'integer',
          },
          someDecimalParameter: {
            description: 'doc',
            type: 'number',
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
          someBooleanParameter: {
            description: 'doc',
            type: 'boolean',
          },
          someIntegerParameter: {
            description: 'doc',
            type: 'integer',
          },
          someDecimalParameter: {
            description: 'doc',
            type: 'number',
          },
        },
        required: ['id', 'uniqueId'],
        title: 'EdFi.Student',
        type: 'object',
      },
    },
  },
});

describe('given IsDescriptor equal true', () => {
  const body: DocumentIdentity = { schoolYear: '2023' };
  const matchingMetaEdModel: TopLevelEntity = {
    ...testModel(),
  };
  let queryResult: DocumentInfo;
  const resourceInfoRequest: ResourceInfo = {
    ...newResourceInfo(),
    isDescriptor: true,
  };
  beforeAll(async () => {
    queryResult = await extractDocumentInfo(resourceInfoRequest, body, matchingMetaEdModel, requestTimestamp);
  });
  it('should return documentInfo.', async () => {
    // Assert
    expect(queryResult).toEqual({
      descriptorReferences: [],
      documentIdentity: {},
      documentReferences: [],
      superclassInfo: null,
      requestTimestamp,
    });
  });
});

describe('given isDescriptor False', () => {
  const body: DescriptorDocument = {
    namespace: 'namespace',
    codeValue: 'codeValue',
    shortDescription: 'shortDescription',
  };
  const matchingMetaEdModel: TopLevelEntity = {
    ...testModel(),
  };
  let queryResult: DocumentInfo;
  const resourceInfoRequest: ResourceInfo = {
    ...newResourceInfo(),
    isDescriptor: false,
  };
  beforeAll(async () => {
    queryResult = await extractDocumentInfo(resourceInfoRequest, body, matchingMetaEdModel, requestTimestamp);
  });
  it('should return superclass null.', async () => {
    // Assert
    expect(queryResult).toEqual({
      descriptorReferences: [],
      documentIdentity: {},
      documentReferences: [],
      superclassInfo: null,
      requestTimestamp,
    });
  });
});

describe('given isDescriptor False', () => {
  const body: DescriptorDocument = {
    namespace: 'namespace',
    codeValue: 'codeValue',
    shortDescription: 'shortDescription',
  };
  const matchingMetaEdModel: TopLevelEntity = {
    ...testSchoolModel(),
  };
  let queryResult: DocumentInfo;
  const resourceInfoRequest: ResourceInfo = {
    ...newResourceInfo(),
    isDescriptor: false,
  };
  beforeAll(async () => {
    queryResult = await extractDocumentInfo(resourceInfoRequest, body, matchingMetaEdModel, requestTimestamp);
  });
  it('should return superclass.', async () => {
    // Assert
    expect(queryResult).toEqual({
      descriptorReferences: [],
      documentIdentity: {},
      documentReferences: [],
      superclassInfo: {
        documentIdentity: {},
        projectName: 'Testing',
        resourceName: 'School',
      },
      requestTimestamp,
    });
  });
});

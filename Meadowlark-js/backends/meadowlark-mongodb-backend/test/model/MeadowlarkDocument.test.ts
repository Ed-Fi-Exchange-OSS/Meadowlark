// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DocumentInfo,
  newDocumentInfo,
  documentIdForDocumentInfo,
  ResourceInfo,
  newResourceInfo,
} from '@edfi/meadowlark-core';
import { MeadowlarkDocument, meadowlarkDocumentFrom } from '../../src/model/MeadowlarkDocument';

describe('given non-superclass document info with no references', () => {
  let meadowlarkDocument: MeadowlarkDocument;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);
  const edfiDoc = { edfi: 'doc' };
  const validate = true;
  const createdBy = 'createdBy';

  beforeAll(async () => {
    meadowlarkDocument = meadowlarkDocumentFrom(resourceInfo, documentInfo, id, edfiDoc, validate, createdBy);
  });

  it('should be a complete document, with no outbound refs and a single alias id', async () => {
    expect(meadowlarkDocument).toMatchInlineSnapshot(`
      {
        "_id": "Qw5FvPdKxAXWnGgh_UOwCVjZeWJb5MV0Gd-nQg",
        "aliasIds": [
          "Qw5FvPdKxAXWnGgh_UOwCVjZeWJb5MV0Gd-nQg",
        ],
        "createdBy": "createdBy",
        "documentIdentity": {
          "natural": "key",
        },
        "edfiDoc": {
          "edfi": "doc",
        },
        "isDescriptor": false,
        "outboundRefs": [],
        "projectName": "",
        "resourceName": "School",
        "resourceVersion": "",
        "validated": true,
      }
    `);
  });
});

describe('given non-superclass document info with references', () => {
  let meadowlarkDocument: MeadowlarkDocument;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key' },
    documentReferences: [
      {
        documentIdentity: { natural: 'key2' },
        isDescriptor: false,
        projectName: 'projectName',
        resourceName: 'resourceName',
      },
    ],
    descriptorReferences: [
      {
        documentIdentity: { natural: 'key3' },
        isDescriptor: true,
        projectName: 'projectName',
        resourceName: 'resourceName2',
      },
    ],
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);
  const edfiDoc = { edfi: 'doc' };
  const validate = true;
  const createdBy = 'createdBy';

  beforeAll(async () => {
    meadowlarkDocument = meadowlarkDocumentFrom(resourceInfo, documentInfo, id, edfiDoc, validate, createdBy);
  });

  it('should have outbound references', async () => {
    expect(meadowlarkDocument.outboundRefs).toMatchInlineSnapshot(`
      [
        "dfR7WrhrnYMh8lF_mnIhAN2Ur2Ji2MmlGBcSUg",
        "t9LSXi1nFRmwyLTPkxiA9RG1ItGTlsxaGzTwKA",
      ]
    `);
  });
});

describe('given superclass document info', () => {
  let meadowlarkDocument: MeadowlarkDocument;

  const resourceInfo: ResourceInfo = {
    ...newResourceInfo(),
    resourceName: 'School',
  };
  const documentInfo: DocumentInfo = {
    ...newDocumentInfo(),
    documentIdentity: { natural: 'key' },
    superclassInfo: { documentIdentity: { natural: 'key2' }, projectName: 'projectName', resourceName: 'resourceName' },
  };
  const id = documentIdForDocumentInfo(resourceInfo, documentInfo);
  const edfiDoc = { edfi: 'doc' };
  const validate = true;
  const createdBy = 'createdBy';

  beforeAll(async () => {
    meadowlarkDocument = meadowlarkDocumentFrom(resourceInfo, documentInfo, id, edfiDoc, validate, createdBy);
  });

  it('should have two alias ids', async () => {
    expect(meadowlarkDocument.aliasIds).toMatchInlineSnapshot(`
      [
        "Qw5FvPdKxAXWnGgh_UOwCVjZeWJb5MV0Gd-nQg",
        "dfR7WrhrnYMh8lF_mnIhAN2Ur2Ji2MmlGBcSUg",
      ]
    `);
  });
});

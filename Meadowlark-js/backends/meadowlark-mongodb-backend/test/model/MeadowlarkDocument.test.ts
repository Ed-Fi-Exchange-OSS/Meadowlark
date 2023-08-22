// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DocumentInfo,
  newDocumentInfo,
  meadowlarkIdForDocumentIdentity,
  ResourceInfo,
  newResourceInfo,
  DocumentUuid,
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

  const documentUuid = '3018d452-a7b7-4f1c-aa91-26ccc48cf4b8' as DocumentUuid;
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);
  const edfiDoc = { edfi: 'doc' };
  const validate = true;
  const createdBy = 'createdBy';

  beforeAll(async () => {
    const createdAt = new Date('2023-01-16').getTime();
    const lastModifiedAt = new Date('2023-02-23').getTime();
    meadowlarkDocument = meadowlarkDocumentFrom({
      resourceInfo,
      documentInfo,
      documentUuid,
      meadowlarkId,
      edfiDoc,
      validate,
      createdBy,
      createdAt,
      lastModifiedAt,
    });
  });

  it('should be a complete document, with no outbound refs and a single alias id', async () => {
    expect(meadowlarkDocument).toMatchInlineSnapshot(`
      {
        "_id": "Qw5FvPdKxAXWnGgh_UOwCVjZeWJb5MV0Gd-nQg",
        "aliasMeadowlarkIds": [
          "Qw5FvPdKxAXWnGgh_UOwCVjZeWJb5MV0Gd-nQg",
        ],
        "createdAt": 1673827200000,
        "createdBy": "createdBy",
        "documentIdentity": {
          "natural": "key",
        },
        "documentUuid": "3018d452-a7b7-4f1c-aa91-26ccc48cf4b8",
        "edfiDoc": {
          "edfi": "doc",
        },
        "isDescriptor": false,
        "lastModifiedAt": 1677110400000,
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
  const documentUuid = '3018d452-a7b7-4f1c-aa91-26ccc48cf4b8' as DocumentUuid;
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);
  const edfiDoc = { edfi: 'doc' };
  const validate = true;
  const createdBy = 'createdBy';

  beforeAll(async () => {
    const createdAt = new Date('2023-02-11').getTime();
    const lastModifiedAt = new Date('2023-02-27').getTime();
    meadowlarkDocument = meadowlarkDocumentFrom({
      resourceInfo,
      documentInfo,
      documentUuid,
      meadowlarkId,
      edfiDoc,
      validate,
      createdBy,
      createdAt,
      lastModifiedAt,
    });
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
  const documentUuid = '3018d452-a7b7-4f1c-aa91-26ccc48cf4b8' as DocumentUuid;
  const meadowlarkId = meadowlarkIdForDocumentIdentity(resourceInfo, documentInfo.documentIdentity);
  const edfiDoc = { edfi: 'doc' };
  const validate = true;
  const createdBy = 'createdBy';

  beforeAll(async () => {
    const createdAt = new Date('2023-01-21').getTime();
    const lastModifiedAt = new Date('2023-01-31').getTime();
    meadowlarkDocument = meadowlarkDocumentFrom({
      resourceInfo,
      documentInfo,
      documentUuid,
      meadowlarkId,
      edfiDoc,
      validate,
      createdBy,
      createdAt,
      lastModifiedAt,
    });
  });

  it('should have two alias ids', async () => {
    expect(meadowlarkDocument.aliasMeadowlarkIds).toMatchInlineSnapshot(`
      [
        "Qw5FvPdKxAXWnGgh_UOwCVjZeWJb5MV0Gd-nQg",
        "dfR7WrhrnYMh8lF_mnIhAN2Ur2Ji2MmlGBcSUg",
      ]
    `);
  });
});

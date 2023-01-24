// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';
import { GetRequest } from '../../src/message/GetRequest';
import { GetResult } from '../../src/message/GetResult';
import { UpsertRequest } from '../../src/message/UpsertRequest';
import { NoResourceInfo } from '../../src/model/ResourceInfo';
import { NoDocumentInfo } from '../../src/model/DocumentInfo';
import { newSecurity } from '../../src/security/Security';
import { UpdateRequest } from '../../src/message/UpdateRequest';
import { DeleteRequest } from '../../src/message/DeleteRequest';
import { UpsertResult } from '../../src/message/UpsertResult';
import { UpdateResult } from '../../src/message/UpdateResult';
import { DeleteResult } from '../../src/message/DeleteResult';

const newUpsertRequest = (): UpsertRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

const newGetRequest = (): GetRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

const newUpdateRequest = (): UpdateRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

const newDeleteRequest = (): DeleteRequest => ({
  id: '',
  resourceInfo: NoResourceInfo,
  validate: false,
  security: { ...newSecurity() },
  traceId: 'traceId',
});

describe('given upsert and no backend plugin has been configured', () => {
  let result: UpsertResult;

  beforeAll(async () => {
    const request = newUpsertRequest();

    result = await NoDocumentStorePlugin.upsertDocument(request);
  });
  it('should return failure', async () => {
    // Assert
    expect(result).toMatchInlineSnapshot(`
      {
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});

describe('given getDocumentById and no backend plugin has been configured', () => {
  let result: GetResult;

  beforeAll(async () => {
    const request = newGetRequest();

    result = await NoDocumentStorePlugin.getDocumentById(request);
  });
  it('should return failure', async () => {
    // Assert
    expect(result).toMatchInlineSnapshot(`
      {
        "document": {},
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});

describe('given updateDocumentById and no backend plugin has been configured', () => {
  let result: UpdateResult;

  beforeAll(async () => {
    const request = newUpdateRequest();

    result = await NoDocumentStorePlugin.updateDocumentById(request);
  });
  it('should return failure', async () => {
    // Assert
    expect(result).toMatchInlineSnapshot(`
      {
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});

describe('given deleteDocumentById and no backend plugin has been configured', () => {
  let result: DeleteResult;

  beforeAll(async () => {
    const request = newDeleteRequest();

    result = await NoDocumentStorePlugin.deleteDocumentById(request);
  });
  it('should return failure', async () => {
    // Assert
    expect(result).toMatchInlineSnapshot(`
      {
        "failureMessage": "",
        "response": "UNKNOWN_FAILURE",
      }
    `);
  });
});

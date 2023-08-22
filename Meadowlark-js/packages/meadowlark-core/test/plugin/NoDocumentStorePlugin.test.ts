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
import { DocumentUuid, MeadowlarkId, TraceId } from '../../src/model/IdTypes';

const newUpsertRequest = (): UpsertRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const newGetRequest = (): GetRequest => ({
  documentUuid: '' as DocumentUuid,
  resourceInfo: NoResourceInfo,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const newUpdateRequest = (): UpdateRequest => ({
  meadowlarkId: '' as MeadowlarkId,
  documentUuid: '' as DocumentUuid,
  resourceInfo: NoResourceInfo,
  documentInfo: NoDocumentInfo,
  edfiDoc: {},
  validateDocumentReferencesExist: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
});

const newDeleteRequest = (): DeleteRequest => ({
  documentUuid: '' as DocumentUuid,
  resourceInfo: NoResourceInfo,
  validateNoReferencesToDocument: false,
  security: { ...newSecurity() },
  traceId: 'traceId' as TraceId,
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
        "documentUuid": "",
        "edfiDoc": {},
        "lastModifiedDate": 0,
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

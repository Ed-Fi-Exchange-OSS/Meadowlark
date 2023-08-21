// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient } from 'pg';
import { GetResult, GetRequest } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { findDocumentByDocumentUuid } from './SqlHelper';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../model/MeadowlarkDocument';

const moduleName = 'postgresql.repository.Get';

export async function getDocumentByDocumentUuid(
  { documentUuid, traceId }: GetRequest,
  client: PoolClient,
): Promise<GetResult> {
  try {
    Logger.debug(`${moduleName}.getDocumentByDocumentUuid ${documentUuid}`, traceId);
    const meadowlarkDocument: MeadowlarkDocument = await findDocumentByDocumentUuid(client, documentUuid);

    if (meadowlarkDocument === NoMeadowlarkDocument) {
      return { response: 'GET_FAILURE_NOT_EXISTS', edfiDoc: {}, documentUuid, lastModifiedDate: 0 };
    }

    return {
      response: 'GET_SUCCESS',
      edfiDoc: meadowlarkDocument.edfi_doc,
      documentUuid,
      lastModifiedDate: meadowlarkDocument.last_modified_at,
    };
  } catch (e) {
    Logger.error(`${moduleName}.getDocumentByDocumentUuid Error retrieving DocumentUuid ${documentUuid}`, traceId, e);
    return { response: 'UNKNOWN_FAILURE', edfiDoc: {}, documentUuid, lastModifiedDate: 0 };
  }
}

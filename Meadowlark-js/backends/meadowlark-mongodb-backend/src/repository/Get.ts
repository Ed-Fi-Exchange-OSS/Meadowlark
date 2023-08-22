// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { Collection, MongoClient, WithId } from 'mongodb';
import { GetResult, GetRequest } from '@edfi/meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getDocumentCollection } from './Db';

const moduleName: string = 'mongodb.repository.get';

export async function getDocumentByDocumentUuid(
  { documentUuid, traceId }: GetRequest,
  client: MongoClient,
): Promise<GetResult> {
  Logger.debug(`${moduleName}.getDocumentByDocumentUuid ${documentUuid}`, traceId);

  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);

  try {
    const result: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne({ documentUuid });
    if (result === null) {
      return { response: 'GET_FAILURE_NOT_EXISTS', edfiDoc: {}, documentUuid, lastModifiedDate: 0 };
    }

    return {
      response: 'GET_SUCCESS',
      edfiDoc: result.edfiDoc,
      documentUuid,
      lastModifiedDate: result.lastModifiedAt,
    };
  } catch (e) {
    Logger.error(`${moduleName}.getDocumentById exception`, traceId, e);
    return { response: 'UNKNOWN_FAILURE', edfiDoc: {}, documentUuid, lastModifiedDate: 0 };
  }
}

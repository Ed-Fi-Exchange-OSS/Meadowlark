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

export async function getDocumentById({ id, traceId }: GetRequest, client: MongoClient): Promise<GetResult> {
  Logger.debug(`${moduleName}.getDocumentById ${id}`, traceId);

  const mongoCollection: Collection<MeadowlarkDocument> = getDocumentCollection(client);

  try {
    const result: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne({ _id: id });
    if (result === null) return { response: 'GET_FAILURE_NOT_EXISTS', document: {} };
    // eslint-disable-next-line no-underscore-dangle
    return { response: 'GET_SUCCESS', document: { id: result._id, ...result.edfiDoc } };
  } catch (e) {
    Logger.error(`${moduleName}.getDocumentById exception`, traceId, e);
    return { response: 'UNKNOWN_FAILURE', document: {} };
  }
}

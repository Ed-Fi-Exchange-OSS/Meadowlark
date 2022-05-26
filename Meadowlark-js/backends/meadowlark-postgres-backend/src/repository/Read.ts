// // SPDX-License-Identifier: Apache-2.0
// // Licensed to the Ed-Fi Alliance under one or more agreements.
// // The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// // See the LICENSE and NOTICES files in the project root for more information.

import { Client } from 'pg';
import { GetResult, GetRequest } from '@edfi/meadowlark-core';

// @ts-ignore
export async function getDocumentById({ id }: GetRequest, client: Client): Promise<GetResult> {
  //  const mongoCollection: Collection<MeadowlarkDocument> = getCollection(client);

  //   try {
  //     const result: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne({ id });
  //     if (result === null) return { result: 'NOT_FOUND', documents: [] };
  //     return { result: 'SUCCESS', documents: [{ id: result.id, ...result.edfiDoc }] };
  //   } catch (e) {
  return { response: 'UNKNOWN_FAILURE', document: [] };
  //   }
}

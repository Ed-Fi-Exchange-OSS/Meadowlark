// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, WithId } from 'mongodb';
import { DocumentInfo, Security, GetResult } from '@edfi/meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getDocumentCollection } from './Db';

export async function getDocumentById(
  _documentInfo: DocumentInfo,
  id: string,
  _security: Security,
  _traceId: string,
): Promise<GetResult> {
  const mongoDocuments: Collection<MeadowlarkDocument> = getDocumentCollection();

  try {
    const result: WithId<MeadowlarkDocument> | null = await mongoDocuments.findOne({ id });
    if (result === null) return { result: 'NOT_FOUND', documents: [] };
    return { result: 'SUCCESS', documents: [{ id: result.id, ...result.edfiDoc }] };
  } catch (e) {
    return { result: 'ERROR', documents: [] };
  }
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, UpdateResult, Document } from 'mongodb';
import {
  DocumentInfo,
  Security,
  ValidationOptions,
  PutResult,
  documentIdForDocumentReference,
  DocumentReference,
} from '@edfi/meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getMongoDocuments } from './Db';

export async function upsertDocument(
  id: string,
  documentInfo: DocumentInfo,
  info: object,
  _validationOptions: ValidationOptions,
  _security: Security,
  _lambdaRequestId: string,
): Promise<PutResult> {
  const mongoDocuments: Collection<MeadowlarkDocument> = getMongoDocuments();

  const document: MeadowlarkDocument = {
    id,
    documentIdentity: documentInfo.documentIdentity,
    projectName: documentInfo.projectName,
    resourceName: documentInfo.resourceName,
    resourceVersion: documentInfo.resourceVersion,
    edfiDoc: info,
    outRefs: documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr)),
  };

  try {
    const result: UpdateResult | Document = await mongoDocuments.replaceOne({ id }, document, { upsert: true });
    if (result.upsertedCount === 0) return { result: 'INSERT_SUCCESS' };
    return { result: 'UPDATE_SUCCESS' };
  } catch (e) {
    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection } from 'mongodb';
import { DocumentInfo, Security, ValidationOptions, PutResult } from '@edfi/meadowlark-core';
import { Document } from '../model/Document';
import { getMongoDocuments } from './Db';

export async function createDocument(
  id: string,
  documentInfo: DocumentInfo,
  info: object,
  _validationOptions: ValidationOptions,
  _security: Security,
  _lambdaRequestId: string,
): Promise<PutResult> {
  const mongoDocuments: Collection<Document> = getMongoDocuments();

  const document: Document = {
    id,
    projectName: documentInfo.projectName,
    resourceName: documentInfo.resourceName,
    resourceVersion: documentInfo.resourceVersion,
    edfiDoc: info,
    outRefs: [], // TODO
  };

  try {
    await mongoDocuments.insertOne(document);
  } catch (e) {
    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
  return { result: 'INSERT_SUCCESS' };
}

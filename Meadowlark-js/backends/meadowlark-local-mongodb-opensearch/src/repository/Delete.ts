// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo, DeleteResult, Security, Logger } from '@edfi/meadowlark-core';
import { ClientSession, Collection, Filter, FindOptions, WithId } from 'mongodb';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getClient, getMongoCollection } from './Db';
import { onlyReturnId } from './WriteHelper';

// MongoDB Filter on documents with the given id in their outRefs list
const onlyDocumentsReferencing = (id: string): Filter<MeadowlarkDocument> => ({ outRefs: id });

// MongoDB FindOption to return at most 5 documents
const limitFive = (session: ClientSession): FindOptions => ({ projection: { _id: 0 }, limit: 5, session });

export async function deleteDocumentById(
  id: string,
  _documentInfo: DocumentInfo,
  validate: boolean,
  _security: Security,
  traceId: string,
): Promise<DeleteResult> {
  const mongoCollection: Collection<MeadowlarkDocument> = getMongoCollection();
  const session: ClientSession = getClient().startSession();

  let deleteResult: DeleteResult = { result: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      if (validate) {
        // Check for any references to the document to be deleted
        const anyReferences: WithId<MeadowlarkDocument> | null = await mongoCollection.findOne(
          onlyDocumentsReferencing(id),
          onlyReturnId(session),
        );

        // Abort on validation failure
        if (anyReferences) {
          Logger.debug(
            `mongodb.repository.Delete.deleteDocumentById: Deleting document id ${id} failed due to existing references`,
            traceId,
          );

          // Get the DocumentIdentities of up to five referring documents for failure message purposes
          const referringDocuments = await mongoCollection.find(onlyDocumentsReferencing(id), limitFive(session)).toArray();

          const failures: string[] = referringDocuments.map(
            (document) => `Resource ${document.resourceName} with identity '${document.documentIdentity}'`,
          );

          deleteResult = {
            result: 'DELETE_FAILURE_REFERENCE',
            failureMessage: `Delete failed due to existing references to document: ${failures.join(',')}`,
          };

          await session.abortTransaction();
          return;
        }
      }

      // Perform the document delete
      Logger.debug(`mongodb.repository.Delete.deleteDocumentById: Deleting document id ${id}`, traceId);

      const { deletedCount } = await mongoCollection.deleteOne({ id }, { session });
      deleteResult.result = deletedCount === 0 ? 'DELETE_FAILURE_NOT_EXISTS' : 'DELETE_SUCCESS';
    });
  } catch (e) {
    Logger.error('mongodb.repository.Delete.deleteDocumentById', traceId, e);

    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return deleteResult;
}

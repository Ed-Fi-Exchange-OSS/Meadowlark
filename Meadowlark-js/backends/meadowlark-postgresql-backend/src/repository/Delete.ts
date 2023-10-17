// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import retry from 'async-retry';
import { Logger, Config } from '@edfi/meadowlark-utilities';
import type { DeleteResult, DeleteRequest, ReferringDocumentInfo, MeadowlarkId } from '@edfi/meadowlark-core';
import type { PoolClient } from 'pg';
import {
  deleteDocumentRowByDocumentUuid,
  deleteOutboundReferencesOfDocumentByMeadowlarkId,
  findReferringDocumentInfoForErrorReporting,
  deleteAliasesForDocumentByMeadowlarkId,
  findReferencingMeadowlarkIds,
  findAliasMeadowlarkIdsForDocumentByDocumentUuid,
  beginTransaction,
  rollbackTransaction,
  commitTransaction,
} from './SqlHelper';
import { MeadowlarkDocumentIdAndAliasId } from '../model/MeadowlarkDocument';

const moduleName = 'postgresql.repository.Delete';

export async function deleteDocumentByDocumentUuid(
  { documentUuid, validateNoReferencesToDocument, traceId }: DeleteRequest,
  client: PoolClient,
): Promise<DeleteResult> {
  Logger.debug(`${moduleName}.deleteDocumentByDocumentUuid ${documentUuid}`, traceId);
  let retryCount = 0;

  try {
    const numberOfRetries: number = Config.get('POSTGRES_MAX_NUMBER_OF_RETRIES');
    const deleteProcess = await retry(
      async (bail) => {
        let deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: '' };
        let meadowlarkId: MeadowlarkId = '' as MeadowlarkId;
        try {
          await beginTransaction(client);
          // Find the alias meadowlarkIds for the document to be deleted
          const documentAliasIdsResult: MeadowlarkDocumentIdAndAliasId[] =
            await findAliasMeadowlarkIdsForDocumentByDocumentUuid(client, documentUuid);
          // Each row contains documentUuid and corresponding meadowlarkId (meadowlark_id),
          // we just need the first row to return the meadowlark_id
          meadowlarkId = documentAliasIdsResult.length > 0 ? documentAliasIdsResult[0].meadowlark_id : ('' as MeadowlarkId);
          if (validateNoReferencesToDocument) {
            // All documents have alias meadowlarkIds. If no alias meadowlarkIds were found, the document doesn't exist
            if (meadowlarkId === '') {
              await rollbackTransaction(client);
              Logger.debug(
                `${moduleName}.deleteDocumentByDocumentUuid: DocumentUuid ${documentUuid} does not exist`,
                traceId,
              );
              deleteResult = { response: 'DELETE_FAILURE_NOT_EXISTS' };
              return deleteResult;
            }

            // Extract from the query result
            const documentAliasMeadowlarkIds: MeadowlarkId[] = documentAliasIdsResult.map((ref) => ref.alias_meadowlark_id);

            // Find any documents that reference this document, either it's own meadowlarkId or an alias
            const referenceResult: MeadowlarkId[] = await findReferencingMeadowlarkIds(client, documentAliasMeadowlarkIds);

            const references = referenceResult.filter((ref) => ref !== meadowlarkId);

            // If this document is referenced, it's a validation failure
            if (references.length > 0) {
              Logger.debug(
                `${moduleName}.deleteDocumentByDocumentUuid: Deleting document meadowlarkId ${meadowlarkId} failed due to existing references`,
                traceId,
              );

              // Get the information of up to five referring documents for failure message purposes
              const referenceIds = references.map((ref) => ref);
              const referringDocumentInfo: ReferringDocumentInfo[] = await findReferringDocumentInfoForErrorReporting(
                client,
                referenceIds,
              );

              if (referringDocumentInfo.length === 0) {
                await rollbackTransaction(client);
                const errorMessage = `${moduleName}.deleteDocumentByDocumentUuid Error retrieving documents referenced by ${meadowlarkId}, a null result set was returned`;
                deleteResult.failureMessage = errorMessage;
                Logger.error(errorMessage, traceId);
                return deleteResult;
              }

              deleteResult = {
                response: 'DELETE_FAILURE_REFERENCE',
                referringDocumentInfo,
              };
              await rollbackTransaction(client);
              return deleteResult;
            }
          }

          // Perform the document delete
          Logger.debug(
            `${moduleName}.deleteDocumentByDocumentUuid: Deleting document documentUuid ${documentUuid}`,
            traceId,
          );
          deleteResult = await deleteDocumentRowByDocumentUuid(client, documentUuid);

          // Delete references where this is the parent document
          Logger.debug(
            `${moduleName}.deleteDocumentByDocumentUuid Deleting references with documentUuid ${documentUuid} as parent meadowlarkId`,
            traceId,
          );
          await deleteOutboundReferencesOfDocumentByMeadowlarkId(client, meadowlarkId);

          // Delete this document from the aliases table
          Logger.debug(
            `${moduleName}.deleteDocumentByDocumentUuid Deleting alias entries with meadowlarkId ${meadowlarkId}`,
            traceId,
          );
          await deleteAliasesForDocumentByMeadowlarkId(client, meadowlarkId);

          await commitTransaction(client);
        } catch (error) {
          retryCount += 1;
          await rollbackTransaction(client);
          // If there's a serialization failure, rollback the transaction
          if (error.code === '40001') {
            if (retryCount >= numberOfRetries) {
              throw Error('Error after maximum retries');
            }
            // Throws the error to be handled by async-retry
            throw error;
          } else {
            // If it's not a serialization failure, don't retry and rethrow the error
            Logger.error(`${moduleName}.deleteDocumentByDocumentUuid`, traceId, error);
            // Throws the error to be handled by the caller
            bail(error);
          }
        }
        return deleteResult;
      },
      {
        retries: numberOfRetries,
        onRetry: (error, attempt) => {
          if (attempt === numberOfRetries) {
            Logger.error('Error after maximum retries', error);
          } else {
            Logger.error('Retrying transaction due to error:', error);
          }
        },
      },
    );
    return deleteProcess;
  } catch (error) {
    Logger.error(`${moduleName}.deleteDocumentByDocumentUuid`, traceId, error);
    return { response: 'UNKNOWN_FAILURE', failureMessage: error.message ?? '' };
  }
}

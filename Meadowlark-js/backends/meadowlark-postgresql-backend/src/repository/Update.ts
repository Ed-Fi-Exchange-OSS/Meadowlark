// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import retry from 'async-retry';
import {
  MeadowlarkId,
  UpdateResult,
  UpdateRequest,
  DocumentReference,
  getMeadowlarkIdForDocumentReference,
  getMeadowlarkIdForSuperclassInfo,
  ReferringDocumentInfo,
} from '@edfi/meadowlark-core';
import { Logger, Config } from '@edfi/meadowlark-utilities';
import type { PoolClient } from 'pg';
import {
  updateDocument,
  deleteAliasesForDocumentByMeadowlarkId,
  insertAlias,
  deleteOutboundReferencesOfDocumentByMeadowlarkId,
  insertOutboundReferences,
  findReferringDocumentInfoForErrorReporting,
  beginTransaction,
  rollbackTransaction,
  commitTransaction,
  findDocumentByDocumentUuid,
} from './SqlHelper';
import { validateReferences } from './ReferenceValidation';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../model/MeadowlarkDocument';

const moduleName = 'postgresql.repository.Update';

export async function updateDocumentByDocumentUuid(updateRequest: UpdateRequest, client: PoolClient): Promise<UpdateResult> {
  const { meadowlarkId, documentUuid, resourceInfo, documentInfo, validateDocumentReferencesExist, traceId } = updateRequest;
  Logger.info(`${moduleName}.updateDocumentByDocumentUuid ${documentUuid}`, traceId);
  let retryCount = 0;

  try {
    const numberOfRetries: number = Config.get('POSTGRES_MAX_NUMBER_OF_RETRIES');
    const updateProcess = await retry(
      async (bail) => {
        let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };
        try {
          const outboundRefs: MeadowlarkId[] = documentInfo.documentReferences.map((dr: DocumentReference) =>
            getMeadowlarkIdForDocumentReference(dr),
          );
          await beginTransaction(client);

          // Get the document to check for staleness and identity change
          const documentFromDb: MeadowlarkDocument = await findDocumentByDocumentUuid(client, documentUuid);

          if (documentFromDb === NoMeadowlarkDocument) return { response: 'UPDATE_FAILURE_NOT_EXISTS' };

          // If request is stale, return conflict
          if (documentFromDb.last_modified_at >= documentInfo.requestTimestamp) {
            return { response: 'UPDATE_FAILURE_WRITE_CONFLICT' };
          }

          const existingMeadowlarkId: MeadowlarkId = documentFromDb.meadowlark_id;
          if (!resourceInfo.allowIdentityUpdates && existingMeadowlarkId !== meadowlarkId) {
            updateResult = { response: 'UPDATE_FAILURE_IMMUTABLE_IDENTITY' };
            return updateResult;
          }

          if (validateDocumentReferencesExist) {
            const failures = await validateReferences(
              documentInfo.documentReferences,
              documentInfo.descriptorReferences,
              outboundRefs,
              client,
              traceId,
            );
            // Abort on validation failure
            if (failures.length > 0) {
              Logger.debug(
                `${moduleName}.updateDocument: Inserting document documentUuid ${documentUuid} failed due to invalid references`,
                traceId,
              );

              const referringDocumentInfo: ReferringDocumentInfo[] = await findReferringDocumentInfoForErrorReporting(
                client,
                [existingMeadowlarkId],
              );

              updateResult = {
                response: 'UPDATE_FAILURE_REFERENCE',
                failureMessage: { error: { message: 'Reference validation failed', failures } },
                referringDocumentInfo,
              };
              await rollbackTransaction(client);
              return updateResult;
            }
          }

          // Perform the document update
          const updateDocumentResult: boolean = await updateDocument(client, updateRequest);

          // Delete existing values from the aliases table
          await deleteAliasesForDocumentByMeadowlarkId(client, existingMeadowlarkId);

          // Perform insert of alias meadowlarkIds
          await insertAlias(client, documentUuid, meadowlarkId, meadowlarkId);
          if (documentInfo.superclassInfo != null) {
            const superclassAliasMeadowlarkId: MeadowlarkId = getMeadowlarkIdForSuperclassInfo(
              documentInfo.superclassInfo,
            ) as MeadowlarkId;
            await insertAlias(client, documentUuid, meadowlarkId, superclassAliasMeadowlarkId);
          }

          // Delete existing references in references table (by old meadowlarkId)
          Logger.debug(
            `${moduleName}.upsertDocument: Deleting references for document meadowlarkId ${existingMeadowlarkId}`,
            traceId,
          );
          await deleteOutboundReferencesOfDocumentByMeadowlarkId(client, existingMeadowlarkId);

          // Adding descriptors to outboundRefs for reference checking
          const descriptorOutboundRefs = documentInfo.descriptorReferences.map((dr: DocumentReference) =>
            getMeadowlarkIdForDocumentReference(dr),
          );
          outboundRefs.push(...descriptorOutboundRefs);

          // Perform insert of references to the references table
          // eslint-disable-next-line no-restricted-syntax
          for (const ref of outboundRefs) {
            Logger.debug(
              `${moduleName}.upsertDocument: Inserting reference meadowlarkId ${ref} for document meadowlarkId ${meadowlarkId}`,
              ref,
            );
            await insertOutboundReferences(client, meadowlarkId, ref as MeadowlarkId);
          }

          await commitTransaction(client);

          updateResult = updateDocumentResult
            ? {
                response: 'UPDATE_SUCCESS',
              }
            : {
                response: 'UPDATE_FAILURE_NOT_EXISTS',
              };
          return updateResult;
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
            Logger.error(`${moduleName}.updateDocumentByDocumentUuid`, traceId, error);
            // Throws the error to be handled by the caller
            bail(error);
          }
        }
        return updateResult;
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
    return updateProcess;
  } catch (e) {
    await rollbackTransaction(client);
    Logger.error(`${moduleName}.upsertDocument`, traceId, e);
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
}

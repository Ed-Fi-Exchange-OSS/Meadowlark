// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  UpdateResult,
  Logger,
  UpdateRequest,
  DocumentReference,
  documentIdForDocumentReference,
  documentIdForSuperclassInfo,
} from '@edfi/meadowlark-core';
import type { PoolClient, QueryResult } from 'pg';
import {
  insertAliasSql,
  deleteAliasesForDocumentSql,
  deleteOutboundReferencesOfDocumentSql,
  documentInsertOrUpdateSql,
  insertOutboundReferencesSql,
} from './SqlHelper';
import { validateReferences } from './ReferenceValidation';

export async function updateDocumentById(
  { id, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpdateRequest,
  client: PoolClient,
): Promise<UpdateResult> {
  let updateResult: UpdateResult = { response: 'UNKNOWN_FAILURE' };

  const outboundRefs: string[] = documentInfo.documentReferences.map((dr: DocumentReference) =>
    documentIdForDocumentReference(dr),
  );

  try {
    await client.query('BEGIN');

    if (validate) {
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
          `postgresql.repository.Update.updateDocument: Inserting document id ${id} failed due to invalid references`,
          traceId,
        );
        updateResult = {
          response: 'UPDATE_FAILURE_REFERENCE',
          failureMessage: `Reference validation failed: ${failures.join(',')}`,
        };
        await client.query('ROLLBACK');
        return updateResult;
      }
    }

    // Perform the document update
    Logger.debug(`postgresql.repository.Upsert.updateDocumentById: Updating document id ${id}`, traceId);

    const documentSql: string = documentInsertOrUpdateSql(
      { id, resourceInfo, documentInfo, edfiDoc, validate, security },
      false,
    );
    const result: QueryResult = await client.query(documentSql);

    // Delete existing values from the aliases table
    await client.query(deleteAliasesForDocumentSql(id));

    // Perform insert of alias ids
    await client.query(insertAliasSql(id, id));
    if (documentInfo.superclassInfo != null) {
      const superclassAliasId = documentIdForSuperclassInfo(documentInfo.superclassInfo);
      await client.query(insertAliasSql(id, superclassAliasId));
    }

    // Delete existing references in references table
    Logger.debug(`postgresql.repository.Upsert.upsertDocument: Deleting references for document id ${id}`, traceId);
    await client.query(deleteOutboundReferencesOfDocumentSql(id));

    // Adding descriptors to outboundRefs for reference checking
    const descriptorOutboundRefs = documentInfo.descriptorReferences.map((dr: DocumentReference) =>
      documentIdForDocumentReference(dr),
    );
    outboundRefs.push(...descriptorOutboundRefs);

    // Perform insert of references to the references table
    // eslint-disable-next-line no-restricted-syntax
    for (const ref of outboundRefs) {
      Logger.debug(`postgresql.repository.Upsert.upsertDocument: Inserting reference id ${ref} for document id ${id}`, ref);
      await client.query(insertOutboundReferencesSql(id, ref));
    }

    await client.query('COMMIT');

    updateResult.response = result.rowCount && result.rowCount > 0 ? 'UPDATE_SUCCESS' : 'UPDATE_FAILURE_NOT_EXISTS';
  } catch (e) {
    await client.query('ROLLBACK');
    Logger.error('postgres.repository.Upsert.upsertDocument', traceId, e);
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }

  return updateResult;
}

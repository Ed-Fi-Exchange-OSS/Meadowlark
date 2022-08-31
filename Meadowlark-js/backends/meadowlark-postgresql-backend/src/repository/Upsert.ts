// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient, QueryResult } from 'pg';
import {
  UpsertResult,
  UpsertRequest,
  Logger,
  DocumentReference,
  documentIdForDocumentReference,
  documentIdForSuperclassInfo,
} from '@edfi/meadowlark-core';

import {
  deleteOutboundReferencesOfDocumentSql,
  documentInsertOrUpdateSql,
  insertOutboundReferencesSql,
  deleteAliasesForDocumentSql,
  insertAliasSql,
  findAliasIdsForDocumentSql,
} from './SqlHelper';
import { validateReferences } from './ReferenceValidation';

export async function upsertDocument(
  { id, resourceInfo, documentInfo, edfiDoc, validate, traceId, security }: UpsertRequest,
  client: PoolClient,
): Promise<UpsertResult> {
  let upsertResult: UpsertResult = { response: 'UNKNOWN_FAILURE' };

  const outboundRefs = documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr));

  try {
    await client.query('BEGIN');

    const documentExistsResult: QueryResult = await client.query(findAliasIdsForDocumentSql(id));
    const isInsert: boolean = documentExistsResult.rowCount === 0;

    const documentUpsertSql: string = documentInsertOrUpdateSql(
      { id, resourceInfo, documentInfo, edfiDoc, validate, security },
      isInsert,
    );

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
          `postgresql.repository.Upsert.upsertDocument: Inserting document id ${id} failed due to invalid references`,
          traceId,
        );
        upsertResult = {
          response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
          failureMessage: `Reference validation failed: ${failures.join(',')}`,
        };
        await client.query('ROLLBACK');
        return upsertResult;
      }
    }

    // Perform the document upsert
    Logger.debug(`postgresql.repository.Upsert.upsertDocument: Upserting document id ${id}`, traceId);
    await client.query(documentUpsertSql);

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
    upsertResult.response = isInsert ? 'INSERT_SUCCESS' : 'UPDATE_SUCCESS';
  } catch (e) {
    Logger.error('postgresql.repository.Upsert.upsertDocument', traceId, e);
    await client.query('ROLLBACK');
    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }

  return upsertResult;
}

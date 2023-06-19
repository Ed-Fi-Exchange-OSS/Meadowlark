// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { ReferringDocumentInfo, DocumentUuid, MeadowlarkId, DeleteResult } from '@edfi/meadowlark-core';
import { Logger } from '@edfi/meadowlark-utilities';
import { Client, PoolClient, QueryResult } from 'pg';
import format from 'pg-format';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../model/MeadowlarkDocument';
import { MeadowlarkDocumentAndAliasId } from '../model/MeadowlarkDocumentAndAliasId';

const moduleName = 'postgresql.repository.SqlHelper';
/**
 * Executes a database begin transaction
 * @param client database connector client.
 */
export async function beginTransaction(client: PoolClient) {
  await client.query('BEGIN');
}

/**
 * Executes a database rollback transaction
 * @param client database connector client.
 */
export async function rollbackTransaction(client: PoolClient) {
  await client.query('ROLLBACK');
}

/**
 * Executes a database commit transaction
 * @param client database connector client.
 */
export async function commitTransaction(client: PoolClient) {
  await client.query('COMMIT');
}

/**
 * Checks if a QueryResult has rows.
 * @param client database connector client.
 * @returns true if it has rows or false if not.
 */
function hasResults(queryResult: QueryResult<any>): boolean {
  if (queryResult == null) {
    return false;
  }
  return (queryResult?.rowCount ?? 0) > 0;
}

/**
 * Returns a list of meadowlarkIds of documents that reference the given meadowlarkIds.
 *
 * @param client database connector client.
 * @param referencedMeadowlarkIds the array of meadowlarkIds of the documents that are being referenced
 * @returns an array of meadowlarkIds of the documents referencing the given meadowlarkIds
 */
export async function findReferencingMeadowlarkIds(
  client: PoolClient,
  referencedMeadowlarkIds: MeadowlarkId[],
): Promise<MeadowlarkId[]> {
  const querySelect = format(
    `SELECT parent_meadowlark_id FROM meadowlark.references WHERE referenced_meadowlark_id IN (%L)`,
    referencedMeadowlarkIds,
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return (hasResults(queryResult) ? queryResult.rows.map((ref) => ref.parent_meadowlark_id) : []) as MeadowlarkId[];
}

/**
 * Returns the alias meadowlarkIds for a given document. Alias meadowlarkIds include the document
 * meadowlarkId itself along with any superclass variations that the document satisfies. For example, a School is a subclass
 * of EducationOrganization, so each School document has an additional alias meadowlarkId as an EducationOrganization.
 *
 * This has a secondary function of read-for-write locking this row for proper updating and deleting.
 *
 * @param client database connector client.
 * @param meadowlarkId the meadowlarkId of the document to find aliases for
 * @returns an array of alias meadowlarkIds of the given document
 */
export async function findAliasMeadowlarkIdsForDocumentByMeadowlarkId(
  client: PoolClient,
  meadowlarkId: MeadowlarkId,
): Promise<MeadowlarkId[]> {
  const querySelect = format(
    `SELECT alias_meadowlark_id FROM meadowlark.aliases WHERE meadowlark_id = %L FOR SHARE NOWAIT`,
    meadowlarkId,
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return (hasResults(queryResult) ? queryResult.rows.map((ref) => ref.alias_meadowlark_id) : []) as MeadowlarkId[];
}

/**
 * Returns the alias meadowlarkIds for a given document. Alias meadowlarkIds include the document
 * meadowlarkId itself along with any superclass variations that the document satisfies. For example, a School is a subclass
 * of EducationOrganization, so each School document has an additional alias meadowlarkId as an EducationOrganization.
 *
 * This has a secondary function of read-for-write locking this row for proper updating and deleting.
 *
 * @param client database connector client.
 * @param documentUuid the documentUuid of the document to find aliases for
 * @returns an array of alias meadowlarkIds of the given document
 */
export async function findAliasMeadowlarkIdsForDocumentByDocumentUuid(
  client: PoolClient,
  documentUuid: DocumentUuid,
): Promise<MeadowlarkDocumentAndAliasId[]> {
  const querySelect = format(
    `SELECT alias_meadowlark_id, meadowlark_id FROM meadowlark.aliases WHERE document_uuid = %L FOR SHARE NOWAIT`,
    documentUuid,
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return (
    hasResults(queryResult)
      ? queryResult.rows.map((ref) => ({
          alias_meadowlark_id: ref.alias_meadowlark_id,
          meadowlark_id: ref.meadowlark_id,
        }))
      : []
  ) as MeadowlarkDocumentAndAliasId[];
}
/**
 * Returns a list of alias meadowlarkIds. Alias meadowlarkIds include the document meadowlarkId
 * itself along with any superclass variations that the document satisfies. For example, a School is a subclass
 * of EducationOrganization, so each School document has an additional alias meadowlarkId as an EducationOrganization.
 *
 * This function does NOT read-for-write lock.
 *
 * @param client database connector client.
 * @param meadowlarkId the meadowlarkId of the document to find aliases for
 * @returns an array of alias meadowlarkIds of the given document
 */
export async function findAliasMeadowlarkId(client: PoolClient, meadowlarkId: MeadowlarkId): Promise<MeadowlarkId[]> {
  const querySelect = format(
    `SELECT alias_meadowlark_id FROM meadowlark.aliases WHERE alias_meadowlark_id = %L`,
    meadowlarkId,
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return (hasResults(queryResult) ? queryResult.rows.map((ref) => ref.alias_meadowlark_id) : []) as MeadowlarkId[];
}

/**
 * Returns a document (with identity)
 * @param client database connector client.
 * @param meadowlarkId The MeadowlarkId of the document to retrieve
 * @returns meadowlark document
 */
export async function findDocumentByMeadowlarkId(
  client: PoolClient,
  meadowlarkId: MeadowlarkId,
): Promise<MeadowlarkDocument> {
  const querySelect = format(
    `
    SELECT document_uuid, meadowlark_id, document_identity, edfi_doc
       FROM meadowlark.documents
       WHERE meadowlark_id = %L;`,
    [meadowlarkId],
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return hasResults(queryResult) ? (queryResult.rows[0] as MeadowlarkDocument) : NoMeadowlarkDocument;
}

/**
 * Returns a document (with identity)
 * @param client database connector client.
 * @param documentUuid The DocumentUuid of the document to retrieve
 * @returns meadowlark document
 */
export async function findDocumentByDocumentUuid(
  client: PoolClient,
  documentUuid: DocumentUuid,
): Promise<MeadowlarkDocument> {
  const querySelect = format(
    `
    SELECT document_uuid, meadowlark_id, document_identity, edfi_doc
       FROM meadowlark.documents
       WHERE document_uuid = %L;`,
    [documentUuid],
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return hasResults(queryResult) ? (queryResult.rows[0] as MeadowlarkDocument) : NoMeadowlarkDocument;
}

/**
 * Returns the the ownership for a given document
 * @param client database connector client.
 * @param documentUuid The documentUuid of the document
 * @returns a meadowlark document to retrieve ownership
 */
export async function findOwnershipForDocumentByDocumentUuid(
  client: PoolClient,
  documentUuid: DocumentUuid,
): Promise<MeadowlarkDocument> {
  const querySelect = format('SELECT created_by FROM meadowlark.documents WHERE document_uuid = %L;', [documentUuid]);
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return hasResults(queryResult) ? (queryResult.rows[0] as MeadowlarkDocument) : NoMeadowlarkDocument;
}

/**
 * Returns the the ownership for a given document
 * @param client database connector client.
 * @param meadowlarkId The meadowlarkId of the document
 * @returns a meadowlark document to retrieve ownership
 */
export async function findOwnershipForDocumentByMeadowlarkId(
  client: PoolClient,
  meadowlarkId: MeadowlarkId,
): Promise<MeadowlarkDocument> {
  const querySelect = format('SELECT created_by FROM meadowlark.documents WHERE meadowlark_id = %L;', [meadowlarkId]);
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return hasResults(queryResult) ? (queryResult.rows[0] as MeadowlarkDocument) : NoMeadowlarkDocument;
}

/**
 * Returns the alias meadowlarkIds from the aliases table for the given
 * documents. This allows for checking for the existence of documents from the aliases table for deletes
 * and general reference validation.
 *
 * @param client database connector client.
 * @param meadowlarkIds the array of meadowlarkId of the document we're checking references for
 * @returns an array of alias meadowlarkIds
 */
export async function validateReferenceExistence(
  client: PoolClient,
  meadowlarkIds: MeadowlarkId[],
): Promise<MeadowlarkId[]> {
  const querySelect = format(
    `SELECT alias_meadowlark_id FROM meadowlark.aliases WHERE alias_meadowlark_id IN (%L) FOR NO KEY UPDATE NOWAIT`,
    meadowlarkIds,
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return (hasResults(queryResult) ? queryResult.rows.map((ref) => ref.alias_meadowlark_id) : []) as MeadowlarkId[];
}

/**
 * Returns a list alias meadowlarkIds from the aliases table for the given
 * documents. This allows for checking for the existence of documents from the aliases table for deletes
 * and general reference validation.
 *
 * @param client database connector client.
 * @param documentUuids the DocumentUuid array of the document we're checking references for
 * @returns SQL query string to retrieve existing alias meadowlarkIds
 */
export async function validateReferenceExistenceByDocumentUuid(
  client: PoolClient,
  documentUuids: DocumentUuid[],
): Promise<MeadowlarkId[]> {
  const querySelect = format(
    `SELECT alias_meadowlark_id FROM meadowlark.aliases WHERE document_uuid IN (%L) FOR NO KEY UPDATE NOWAIT`,
    documentUuids,
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return (hasResults(queryResult) ? queryResult.rows.map((ref) => ref.alias_meadowlark_id) : []) as MeadowlarkId[];
}

/**
 * Returns up to five documents that reference this document.
 * This is for error reporting when an attempt is made to delete the document.
 *
 * @param client database connector client.
 * @param referringMeadowlarkIds The referring documents
 * @returns an array of the referring documents
 */
export async function findReferringDocumentInfoForErrorReporting(
  client: PoolClient,
  referringMeadowlarkIds: MeadowlarkId[],
): Promise<ReferringDocumentInfo[]> {
  const querySelect = format(
    `SELECT project_name, resource_name, resource_version, meadowlark_id, document_uuid FROM meadowlark.documents WHERE meadowlark_id IN (%L) LIMIT 5`,
    referringMeadowlarkIds,
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return (
    hasResults(queryResult)
      ? queryResult.rows.map((document) => ({
          resourceName: document.resource_name,
          meadowlarkId: document.meadowlark_id,
          documentUuid: document.document_uuid,
          projectName: document.project_name,
          resourceVersion: document.resource_version,
        }))
      : []
  ) as ReferringDocumentInfo[];
}

/**
 * Inserts an alias entry to the alias table
 * @param meadowlarkId the document with the given alias meadowlarkId
 * @param aliasId the alias meadowlarkId for the given document, this may be the same as the meadowlarkId
 * @returns if the result returned rows
 */
export async function insertAlias(
  client: PoolClient,
  documentUuid: DocumentUuid,
  meadowlarkId: MeadowlarkId,
  aliasId: MeadowlarkId,
): Promise<boolean> {
  const queryInsert = format(
    `INSERT INTO meadowlark.aliases
     (document_uuid, meadowlark_id, alias_meadowlark_id)
     VALUES (%L)`,
    [documentUuid, meadowlarkId, aliasId],
  );
  const queryResult: QueryResult<any> = await client.query(queryInsert);

  return hasResults(queryResult);
}

/**
 * Inserts an outbound reference for a document into the references table
 * @param meadowlarkId The parent document of the reference
 * @param referencedMeadowlarkId The document that is referenced
 * @returns if the result returned rows
 */
export async function insertOutboundReferences(
  client: PoolClient,
  meadowlarkId: MeadowlarkId,
  referencedMeadowlarkId: MeadowlarkId,
): Promise<boolean> {
  const queryInsert = format(
    'INSERT INTO meadowlark.references (parent_meadowlark_id, referenced_meadowlark_id) VALUES (%L);',
    [meadowlarkId, referencedMeadowlarkId],
  );
  const queryResult: QueryResult<any> = await client.query(queryInsert);
  return hasResults(queryResult);
}

/**
 * Inserts or updates a document in the database
 * @param param0 Document info for insert/update
 * @param isInsert is insert or update SQL re
 * @returns if the result returned rows
 */
export async function insertOrUpdateDocument(
  client: PoolClient,
  { meadowlarkId, documentUuid, resourceInfo, documentInfo, edfiDoc, validateDocumentReferencesExist, security },
  isInsert: boolean,
): Promise<boolean> {
  const documentValues = [
    meadowlarkId,
    documentUuid,
    JSON.stringify(documentInfo.documentIdentity),
    resourceInfo.projectName,
    resourceInfo.resourceName,
    resourceInfo.resourceVersion,
    resourceInfo.isDescriptor,
    validateDocumentReferencesExist,
    security.clientId,
    edfiDoc,
  ];

  let documentSql: string;

  if (isInsert) {
    documentSql = format(
      `
      INSERT INTO meadowlark.documents
        (meadowlark_id, document_uuid, document_identity, project_name, resource_name, resource_version, is_descriptor,
        validated, created_by, edfi_doc)
        VALUES (%L)
        RETURNING document_uuid;`,
      documentValues,
    );
  } else {
    documentSql = format(
      `
      UPDATE meadowlark.documents
        SET
        meadowlark_id = %L,
        document_identity = %L,
        project_name = %L,
        resource_name = %L,
        resource_version = %L,
        is_descriptor = %L,
        validated = %L,
        created_by = %L,
        edfi_doc = %L
        WHERE meadowlark.documents.document_uuid = %L;`,
      documentValues[0],
      documentValues[2],
      documentValues[3],
      documentValues[4],
      documentValues[5],
      documentValues[6],
      documentValues[7],
      documentValues[8],
      documentValues[9],
      documentValues[1],
    );
  }
  const queryResult: QueryResult<any> = await client.query(documentSql);
  return hasResults(queryResult);
}

// Deletes
/**
 * Checks a delete result to return a deleteResult
 * @param deleteQueryResult The result from database
 * @param countDeletedRows if true, it validates if at least one row was deleted.
 * @returns a DeleteResult
 */
async function checkDeleteResult(
  client: PoolClient,
  deleteQueryResult: QueryResult<any>,
  countDeletedRows: boolean = false,
): Promise<DeleteResult> {
  const deleteResult: DeleteResult = { response: 'UNKNOWN_FAILURE', failureMessage: '' };
  if (!hasResults(deleteQueryResult)) {
    await rollbackTransaction(client);
    deleteResult.failureMessage = `deleteDocumentByDocumentUuId: Failure deleting document, a null result was returned`;
    return deleteResult;
  }
  if (countDeletedRows) {
    return deleteQueryResult.rows[0].count === '0'
      ? { response: 'DELETE_FAILURE_NOT_EXISTS' }
      : { response: 'DELETE_SUCCESS' };
  }
  return { response: 'DELETE_SUCCESS' };
}
/**
 * Deletes a document from the database
 * @param meadowlarkId the document to delete from the documents table
 * @returns a DeleteResult
 */
export async function deleteDocumentRowByDocumentUuid(
  client: PoolClient,
  documentUuid: DocumentUuid,
): Promise<DeleteResult> {
  const deleteQuery = format(
    'with del as (DELETE FROM meadowlark.documents WHERE document_uuid = %L RETURNING id) SELECT COUNT(*) FROM del;',
    [documentUuid],
  );
  const deleteQueryResult: QueryResult<any> = await client.query(deleteQuery);
  return checkDeleteResult(client, deleteQueryResult, true);
}

/**
 * Deletes the outbound references of a document from the database.
 * Used as part of deleting the document itself.
 *
 * @param meadowlarkId the meadowlarkId of the document whose outbound references we want to delete
 * @returns if the result returned rows
 */
export async function deleteOutboundReferencesOfDocumentByMeadowlarkId(
  client: PoolClient,
  meadowlarkId: MeadowlarkId,
): Promise<Boolean> {
  const deleteQuery = format('DELETE FROM meadowlark.references WHERE parent_meadowlark_id = (%L);', [meadowlarkId]);
  const deleteQueryResult: QueryResult<any> = await client.query(deleteQuery);
  return hasResults(deleteQueryResult);
}

/**
 * Deletes aliases for a given document meadowlarkId. Used as part of deleting the document itself.
 * @param meadowlarkId the meadowlarkId of the document we're deleting aliases for
 * @returns if the result returned rows
 */
export async function deleteAliasesForDocumentByMeadowlarkId(
  client: PoolClient,
  meadowlarkId: MeadowlarkId,
): Promise<Boolean> {
  const deleteQuery = format(
    `DELETE from meadowlark.aliases
  WHERE meadowlark_id = %L;`,
    [meadowlarkId],
  );
  const deleteQueryResult: QueryResult<any> = await client.query(deleteQuery);
  return hasResults(deleteQueryResult);
}

// SQL for DDL

/**
 * Creates the meadowlark database
 * @param meadowlarkDbName the name of the database to create
 * @returns if the result returned rows
 */
export async function createDatabase(client: Client, meadowlarkDbName: string): Promise<boolean> {
  const createDatabaseScript = format('CREATE DATABASE %I', meadowlarkDbName);
  const createDatabaseResult: QueryResult<any> = await client.query(createDatabaseScript);
  return hasResults(createDatabaseResult);
}

/**
 * SQL query string to create schema in the meadowlark database
 */
const createSchemaSql = 'CREATE SCHEMA IF NOT EXISTS meadowlark';

/**
 * SQL query string to create document table
 */
const createDocumentTableSql = `
  CREATE TABLE IF NOT EXISTS meadowlark.documents(
  id bigserial PRIMARY KEY,
  meadowlark_id VARCHAR(56) NOT NULL,
  document_uuid uuid,
  document_identity JSONB NOT NULL,
  project_name VARCHAR NOT NULL,
  resource_name VARCHAR NOT NULL,
  resource_version VARCHAR NOT NULL,
  is_descriptor boolean NOT NULL,
  validated boolean NOT NULL,
  created_by VARCHAR(100) NULL,
  edfi_doc JSONB NOT NULL);`;

// All queries are on meadowlark_id, which must be unique
const createDocumentTableUniqueIndexSql =
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_meadowlark_documents ON meadowlark.documents(meadowlark_id)';

// All queries are on document_uuid, which must be unique
const createDocumentUuidTableUniqueIndexSql =
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_meadowlark_document_uuid ON meadowlark.documents(document_uuid)';

/**
 * SQL query string to create the references table
 */
const createReferencesTableSql = `
  CREATE TABLE IF NOT EXISTS meadowlark.references(
  id bigserial PRIMARY KEY,
  parent_meadowlark_id VARCHAR NOT NULL,
  referenced_meadowlark_id VARCHAR NOT NULL);`;

// For reference checking before parent delete
const createReferencesTableCheckingIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_references_checking ON meadowlark.references(referenced_meadowlark_id)';

// For reference removal in transaction with parent update/delete
const createReferencesTableDeletingIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_references_deleting ON meadowlark.references(parent_meadowlark_id)';

/**
 * SQL query string to create the aliases table
 */
const createAliasesTableSql = `
  CREATE TABLE IF NOT EXISTS meadowlark.aliases(
    id bigserial PRIMARY KEY,
    meadowlark_id VARCHAR,
    document_uuid uuid,
    alias_meadowlark_id VARCHAR);`;

// For finding alias meadowlarkIds given a document meadowlarkId
const createAliasesTableDocumentIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_aliases_meadowlark_id ON meadowlark.aliases(meadowlark_id)';

// For finding alias meadowlarkIds given a document_uuid
const createAliasesTableDocumentUuidIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_aliases_document_uuid ON meadowlark.aliases(document_uuid)';

// For finding document meadowlarkIds given an alias meadowlarkId
const createAliasesTableAliasIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_aliases_alias_meadowlark_id ON meadowlark.aliases(alias_meadowlark_id)';

/**
 * Checks that the meadowlark schema, document and references tables exist in the database, if not will create them
 * @param client The Postgres client for querying
 */
export async function checkExistsAndCreateTables(client: PoolClient) {
  try {
    await client.query(createSchemaSql);
    await client.query(createDocumentTableSql);
    await client.query(createDocumentTableUniqueIndexSql);
    await client.query(createDocumentUuidTableUniqueIndexSql);
    await client.query(createReferencesTableSql);
    await client.query(createReferencesTableCheckingIndexSql);
    await client.query(createReferencesTableDeletingIndexSql);
    await client.query(createAliasesTableSql);
    await client.query(createAliasesTableDocumentIndexSql);
    await client.query(createAliasesTableDocumentUuidIndexSql);
    await client.query(createAliasesTableAliasIndexSql);
  } catch (e) {
    Logger.error(`${moduleName}.checkExistsAndCreateTables error connecting to PostgreSQL`, null, e);
    throw e;
  }
}

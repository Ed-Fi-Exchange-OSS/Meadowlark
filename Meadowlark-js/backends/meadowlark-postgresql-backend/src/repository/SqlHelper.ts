// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { ReferringDocumentInfo, DocumentUuid, MeadowlarkId } from '@edfi/meadowlark-core';
import { PoolClient, QueryResult } from 'pg';
import format from 'pg-format';
import { MeadowlarkDocument, NoMeadowlarkDocument } from '../model/MeadowlarkDocument';
import { MeadowlarkAlias } from '../model/MeadowlarkAlias';

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
  return ((queryResult?.rowCount ?? 0) > 0 ? queryResult.rows.map((ref) => ref.parent_meadowlark_id) : []) as MeadowlarkId[];
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
  return ((queryResult?.rowCount ?? 0) > 0 ? queryResult.rows.map((ref) => ref.alias_meadowlark_id) : []) as MeadowlarkId[];
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
): Promise<MeadowlarkAlias[]> {
  const querySelect = format(
    `SELECT alias_meadowlark_id, meadowlark_id FROM meadowlark.aliases WHERE document_uuid = %L FOR SHARE NOWAIT`,
    documentUuid,
  );
  const queryResult: QueryResult<any> = await client.query(querySelect);
  return (
    (queryResult?.rowCount ?? 0) > 0
      ? queryResult.rows.map((ref) => ({
          alias_meadowlark_id: ref.alias_meadowlark_id,
          meadowlark_id: ref.meadowlark_id,
        }))
      : []
  ) as MeadowlarkAlias[];
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
  return ((queryResult?.rowCount ?? 0) > 0 ? queryResult.rows.map((ref) => ref.alias_meadowlark_id) : []) as MeadowlarkId[];
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
  return (queryResult?.rowCount ?? 0) > 0 ? (queryResult.rows[0] as MeadowlarkDocument) : NoMeadowlarkDocument;
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
  return (queryResult?.rowCount ?? 0) > 0 ? (queryResult.rows[0] as MeadowlarkDocument) : NoMeadowlarkDocument;
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
  return (queryResult?.rowCount ?? 0) > 0 ? (queryResult.rows[0] as MeadowlarkDocument) : NoMeadowlarkDocument;
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
  return (queryResult?.rowCount ?? 0) > 0 ? (queryResult.rows[0] as MeadowlarkDocument) : NoMeadowlarkDocument;
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
  return ((queryResult?.rowCount ?? 0) > 0 ? queryResult.rows.map((ref) => ref.alias_meadowlark_id) : []) as MeadowlarkId[];
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
  return ((queryResult?.rowCount ?? 0) > 0 ? queryResult.rows.map((ref) => ref.alias_meadowlark_id) : []) as MeadowlarkId[];
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
    (queryResult?.rowCount ?? 0) > 0
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

// SQL for inserts/updates/upserts

/**
 * Returns the SQL statement to add an alias entry to the alias table
 * @param meadowlarkId the document with the given alias meadowlarkId
 * @param aliasId the alias meadowlarkId for the given document, this may be the same as the meadowlarkId
 * @returns SQL query string to insert into the aliases table
 */
export function insertAliasSql(documentUuid: DocumentUuid, meadowlarkId: MeadowlarkId, aliasId: MeadowlarkId): string {
  return format(
    `INSERT INTO meadowlark.aliases
     (document_uuid, meadowlark_id, alias_meadowlark_id)
     VALUES (%L)`,
    [documentUuid, meadowlarkId, aliasId],
  );
}

/**
 * Returns the SQL statement to insert an outbound reference for a document into the references table
 * @param meadowlarkId The parent document of the reference
 * @param referencedMeadowlarkId The document that is referenced
 * @returns SQL query string to insert reference into references table
 */
export function insertOutboundReferencesSql(meadowlarkId: MeadowlarkId, referencedMeadowlarkId: MeadowlarkId): string {
  return format('INSERT INTO meadowlark.references (parent_meadowlark_id, referenced_meadowlark_id) VALUES (%L);', [
    meadowlarkId,
    referencedMeadowlarkId,
  ]);
}

/**
 * Returns the SQL statement for inserting or updating a document in the database
 * @param param0 Document info for insert/update
 * @param isInsert is insert or update SQL re
 * @returns SQL query string for inserting or updating provided document info
 */
export function documentInsertOrUpdateSql(
  { meadowlarkId, documentUuid, resourceInfo, documentInfo, edfiDoc, validateDocumentReferencesExist, security },
  isInsert: boolean,
): string {
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
  return documentSql;
}

// SQL for Deletes

/**
 * Returns the SQL query for deleting a document from the database
 * @param meadowlarkId the document to delete from the documents table
 * @returns SQL query string to delete the document
 */
export function deleteDocumentByDocumentUuIdSql(documentUuid: DocumentUuid): string {
  return format(
    'with del as (DELETE FROM meadowlark.documents WHERE document_uuid = %L RETURNING id) SELECT COUNT(*) FROM del;',
    [documentUuid],
  );
}

/**
 * Returns the SQL query for deleting the outbound references of a document from the database.
 * Used as part of deleting the document itself.
 *
 * @param meadowlarkId the meadowlarkId of the document whose outbound references we want to delete
 * @returns SQL query string to delete references
 */
export function deleteOutboundReferencesOfDocumentByMeadowlarkIdSql(meadowlarkId: MeadowlarkId): string {
  const sql = format('DELETE FROM meadowlark.references WHERE parent_meadowlark_id = (%L);', [meadowlarkId]);
  return sql;
}

/**
 * Returns the SQL query for deleting aliases for a given document meadowlarkId. Used as part of deleting the document itself.
 * @param meadowlarkId the meadowlarkId of the document we're deleting aliases for
 * @returns SQL query string for deleting aliases
 */
export function deleteAliasesForDocumentByMeadowlarkIdSql(meadowlarkId: MeadowlarkId): string {
  return format(
    `DELETE from meadowlark.aliases
  WHERE meadowlark_id = %L`,
    [meadowlarkId],
  );
}

// SQL for DDL

/**
 * Returns the SQL to create the meadowlark database
 * @param meadowlarkDbName the name of the database to create
 * @returns SQL query string to create the database
 */
export function createDatabaseSql(meadowlarkDbName: string): string {
  return format('CREATE DATABASE %I', meadowlarkDbName);
}

/**
 * SQL query string to create schema in the meadowlark database
 */
export const createSchemaSql = 'CREATE SCHEMA IF NOT EXISTS meadowlark';

/**
 * SQL query string to create document table
 */
export const createDocumentTableSql = `
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
export const createDocumentTableUniqueIndexSql =
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_meadowlark_documents ON meadowlark.documents(meadowlark_id)';

// All queries are on document_uuid, which must be unique
export const createDocumentUuidTableUniqueIndexSql =
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_meadowlark_document_uuid ON meadowlark.documents(document_uuid)';

/**
 * SQL query string to create the references table
 */
export const createReferencesTableSql = `
  CREATE TABLE IF NOT EXISTS meadowlark.references(
  id bigserial PRIMARY KEY,
  parent_meadowlark_id VARCHAR NOT NULL,
  referenced_meadowlark_id VARCHAR NOT NULL);`;

// For reference checking before parent delete
export const createReferencesTableCheckingIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_references_checking ON meadowlark.references(referenced_meadowlark_id)';

// For reference removal in transaction with parent update/delete
export const createReferencesTableDeletingIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_references_deleting ON meadowlark.references(parent_meadowlark_id)';

/**
 * SQL query string to create the aliases table
 */
export const createAliasesTableSql = `
  CREATE TABLE IF NOT EXISTS meadowlark.aliases(
    id bigserial PRIMARY KEY,
    meadowlark_id VARCHAR,
    document_uuid uuid,
    alias_meadowlark_id VARCHAR);`;

// For finding alias meadowlarkIds given a document meadowlarkId
export const createAliasesTableDocumentIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_aliases_meadowlark_id ON meadowlark.aliases(meadowlark_id)';

// For finding alias meadowlarkIds given a document_uuid
export const createAliasesTableDocumentUuidIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_aliases_document_uuid ON meadowlark.aliases(document_uuid)';

// For finding document meadowlarkIds given an alias meadowlarkId
export const createAliasesTableAliasIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_aliases_alias_meadowlark_id ON meadowlark.aliases(alias_meadowlark_id)';

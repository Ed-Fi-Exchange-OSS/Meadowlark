// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import format from 'pg-format';

// SQL for Selects

/**
 * Returns the SQL query that does a reverse lookup to find the ids of documents that reference the given ids.
 *
 * @param referencedDocumentIds the ids of the documents that are being referenced
 * @returns a SQL query to find the ids of the documents referencing the given ids
 */
export function findReferencingDocumentIdsSql(referencedDocumentIds: string[]): string {
  return format(
    `SELECT parent_document_id FROM meadowlark.references WHERE referenced_document_id IN (%L)`,
    referencedDocumentIds,
  );
}

/**
 * Returns the SQL query to find the alias ids for a given document. Alias ids include the document id
 * itself along with any superclass variations that the document satisifies. For example, a School is a subclass
 * of EducationOrganization, so each School document has an additional alias id as an EducationOrganization.
 *
 * This has a secondary function of read-for-write locking this row for proper updating and deleting.
 *
 * @param documentId the id of the document to find aliases for
 * @returns a SQL query to find the alias ids of the given document
 */
export function findAliasIdsForDocumentSql(documentId: string): string {
  return format(`SELECT alias_id FROM meadowlark.aliases WHERE document_id = %L FOR SHARE NOWAIT`, documentId);
}

/**
 * Returns the SQL query to find the existence of an alias id. Alias ids include the document id
 * itself along with any superclass variations that the document satisifies. For example, a School is a subclass
 * of EducationOrganization, so each School document has an additional alias id as an EducationOrganization.
 *
 * This function does NOT read-for-write lock.
 *
 * @param documentId the id of the document to find aliases for
 * @returns a SQL query to find the alias ids of the given document
 */
export function findAliasIdSql(documentId: string): string {
  return format(`SELECT alias_id FROM meadowlark.aliases WHERE alias_id = %L`, documentId);
}

/**
 * Returns the SQL statement for retrieving a document (with identity)
 * @param documentId The identifier of the document to retrieve
 * @returns SQL query string to retrieve a document
 */
export function findDocumentByIdSql(documentId: string): string {
  return format(
    `
    SELECT document_id, document_identity, edfi_doc
       FROM meadowlark.documents
       WHERE document_id = %L;`,
    [documentId],
  );
}

/**
 * Returns the SQL query for retrieving the ownership for a given document
 * @param documentId The identifier of the document
 * @returns SQL query string to retrieve ownership
 */
export function findOwnershipForDocumentSql(documentId: string): string {
  return format('SELECT created_by FROM meadowlark.documents WHERE document_id = %L;', [documentId]);
}

/**
 * Returns the SQL statement for retrieving alias ids from the aliases table for the given
 * documents. This allows for checking for the existence of documents from the aliases table for deletes
 * and general reference validation.
 *
 * @param documentIds the id of the document we're checking references for
 * @returns SQL query string to retrieve existing alias ids
 */
export function validateReferenceExistenceSql(documentIds: string[]): string {
  return format(`SELECT alias_id FROM meadowlark.aliases WHERE alias_id IN (%L) FOR NO KEY UPDATE NOWAIT`, documentIds);
}

/**
 * Returns the SQL statement to find up to five documents that reference this document.
 * This is for error reporting when an attempt is made to delete the document.
 *
 * @param referringDocumentIds The referring documents
 * @returns SQL query string to retrieve the document_id and resource_name of the referring documents
 */
export function findReferringDocumentInfoForErrorReportingSql(referringDocumentIds: string[]): string {
  return format(
    `SELECT project_name, resource_name, resource_version, document_id FROM meadowlark.documents WHERE document_id IN (%L) LIMIT 5`,
    referringDocumentIds,
  );
}

// SQL for inserts/updates/upserts

/**
 * Returns the SQL statement to add an alias entry to the alias table
 * @param documentId the document with the given alias id
 * @param aliasId the alias id for the given document, this may be the same as the documentId
 * @returns SQL query string to insert into the aliases table
 */
export function insertAliasSql(documentId: string, aliasId: string): string {
  return format(
    `INSERT INTO meadowlark.aliases
     (document_id, alias_id)
     VALUES (%L)`,
    [documentId, aliasId],
  );
}

/**
 * Returns the SQL statement to insert an outbound reference for a document into the references table
 * @param documentId The parent document of the reference
 * @param referencedDocumentId The document that is referenced
 * @returns SQL query string to insert reference into references table
 */
export function insertOutboundReferencesSql(documentId: string, referencedDocumentId: String): string {
  return format('INSERT INTO meadowlark.references (parent_document_id, referenced_document_id) VALUES (%L);', [
    documentId,
    referencedDocumentId,
  ]);
}

/**
 * Returns the SQL statement for inserting or updating a document in the database
 * @param param0 Document info for insert/update
 * @param isInsert is insert or update SQL re
 * @returns SQL query string for inserting or updating provided document info
 */
export function documentInsertOrUpdateSql(
  { id, resourceInfo, documentInfo, edfiDoc, validate, security },
  isInsert: boolean,
): string {
  const documentValues = [
    id,
    JSON.stringify(documentInfo.documentIdentity),
    resourceInfo.projectName,
    resourceInfo.resourceName,
    resourceInfo.resourceVersion,
    resourceInfo.isDescriptor,
    validate,
    security.clientId,
    edfiDoc,
  ];

  let documentSql: string;

  if (isInsert) {
    documentSql = format(
      `
      INSERT INTO meadowlark.documents
        (document_id, document_identity, project_name, resource_name, resource_version, is_descriptor,
        validated, created_by, edfi_doc)
        VALUES (%L)
        RETURNING document_id;`,
      documentValues,
    );
  } else {
    documentSql = format(
      `
      UPDATE meadowlark.documents
        SET
        document_id = %L,
        document_identity = %L,
        project_name = %L,
        resource_name = %L,
        resource_version = %L,
        is_descriptor = %L,
        validated = %L,
        created_by = %L,
        edfi_doc = %L
        WHERE meadowlark.documents.document_id = %1$L;`,
      documentValues[0],
      documentValues[1],
      documentValues[2],
      documentValues[3],
      documentValues[4],
      documentValues[5],
      documentValues[6],
      documentValues[7],
      documentValues[8],
    );
  }
  return documentSql;
}

// SQL for Deletes

/**
 * Returns the SQL query for deleting a document from the database
 * @param documentId the document to delete from the documents table
 * @returns SQL query string to delete the document
 */
export function deleteDocumentByIdSql(documentId: string): string {
  return format(
    'with del as (DELETE FROM meadowlark.documents WHERE document_id = %L RETURNING id) SELECT COUNT(*) FROM del;',
    [documentId],
  );
}

/**
 * Returns the SQL query for deleting the outbound references of a document from the database.
 * Used as part of deleting the document itself.
 *
 * @param documentId the id of the document whose outbound references we want to delete
 * @returns SQL query string to delete references
 */
export function deleteOutboundReferencesOfDocumentSql(documentId: string): string {
  const sql = format('DELETE FROM meadowlark.references WHERE parent_document_id = (%L);', [documentId]);
  return sql;
}

/**
 * Returns the SQL query for deleting aliases for a given document id. Used as part of deleting the document itself.
 * @param documentId the id of the document we're deleting aliases for
 * @returns SQL query string for deleting aliases
 */
export function deleteAliasesForDocumentSql(documentId: string): string {
  return format(
    `DELETE from meadowlark.aliases
  WHERE document_id = %L`,
    [documentId],
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
  document_id VARCHAR(56) NOT NULL,
  document_identity JSONB NOT NULL,
  project_name VARCHAR NOT NULL,
  resource_name VARCHAR NOT NULL,
  resource_version VARCHAR NOT NULL,
  is_descriptor boolean NOT NULL,
  validated boolean NOT NULL,
  created_by VARCHAR(100) NULL,
  edfi_doc JSONB NOT NULL);`;

// All queries are on document_id, which must be unique
export const createDocumentTableUniqueIndexSql =
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_meadowlark_documents ON meadowlark.documents(document_id)';

/**
 * SQL query string to create the references table
 */
export const createReferencesTableSql = `
  CREATE TABLE IF NOT EXISTS meadowlark.references(
  id bigserial PRIMARY KEY,
  parent_document_id VARCHAR NOT NULL,
  referenced_document_id VARCHAR NOT NULL);`;

// For reference checking before parent delete
export const createReferencesTableCheckingIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_references_checking ON meadowlark.references(referenced_document_id)';

// For reference removal in transaction with parent update/delete
export const createReferencesTableDeletingIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_references_deleting ON meadowlark.references(parent_document_id)';

/**
 * SQL query string to create the aliases table
 */
export const createAliasesTableSql = `
  CREATE TABLE IF NOT EXISTS meadowlark.aliases(
    id bigserial PRIMARY KEY,
    document_id VARCHAR,
    alias_id VARCHAR);`;

// For finding alias ids given a document id
export const createAliasesTableDocumentIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_aliases_document_id ON meadowlark.aliases(document_id)';

// For finding document ids given an alias id
export const createAliasesTableAliasIndexSql =
  'CREATE INDEX IF NOT EXISTS ix_meadowlark_aliases_alias_id ON meadowlark.aliases(alias_id)';

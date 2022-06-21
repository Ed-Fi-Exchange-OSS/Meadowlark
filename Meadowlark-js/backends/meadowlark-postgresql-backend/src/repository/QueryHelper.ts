// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import format from 'pg-format';

// SQL for Selects

/**
 * Function that produces a parametrized SQL query for retrieving a document (with identity)
 * @param documentId The identifier of the document to retrieve
 * @returns SQL query string to retrieve a document
 */
export function getDocumentByIdSql(documentId: string): string {
  return format(
    `
    SELECT document_id, document_identity, edfi_doc
       FROM meadowlark.documents
       WHERE document_id = %L;`,
    [documentId],
  );
}

/**
 * Function that produces a parametrized SQL query for retrieving the references for a given document
 * @param documentId The identifier of the document
 * @returns SQL query string to retrieve references
 */
export function getRetrieveReferencesByDocumentIdSql(documentId: string): string {
  return format('SELECT referenced_document_id FROM meadowlark.references WHERE parent_document_id=%L', [documentId]);
}

/**
 * Function that produces a parametrized SQL query for retrieving the ownership for a given document
 * @param documentId The identifier of the document
 * @returns SQL query string to retrieve ownership
 */
export function getDocumentOwnershipByIdSql(documentId: string): string {
  return format('SELECT created_by FROM meadowlark.documents WHERE document_id = %L;', [documentId]);
}

/**
 * Checks for the existence of a document in the database
 * @param documentId Document id to check for existence
 * @returns SQL query string to determine document existence
 */
export function getCheckDocumentExistsSql(documentId: string): string {
  return format(`SELECT exists (SELECT 1 FROM meadowlark.documents WHERE document_id = %L LIMIT 1);`, [documentId]);
}

/**
 * Checks if this document is referenced by other documents
 * @param documentId Document id to check for references
 * @returns SQL query string to determine references existence
 */
export function getCheckIsReferencedDocumentSql(documentId: string): string {
  return format(`SELECT exists (SELECT 1 FROM meadowlark.references WHERE referenced_document_id = %L LIMIT 1);`, [
    documentId,
  ]);
}

/**
 * Returns up to five documents that reference this document - for error reporting when an attempt is made to delete
 * the document
 * @param documentId The document being referenced
 * @returns SQL query string to retrieve the document_id, document_identity and resource_name of the referenced document
 */
export function getReferencedByDocumentSql(documentId: string): string {
  return format(
    `SELECT document_id, resource_name, document_identity FROM meadowlark.references
    JOIN meadowlark.documents on meadowlark.documents.document_id = meadowlark.references.referenced_document_id
    WHERE referenced_document_id = %L LIMIT 5;`,
    [documentId],
  );
}

// SQL for inserts/updates/upserts

/**
 * Returns the SQL statement to insert a referenced document into the references table
 * @param documentId The parent document of the reference
 * @param referencedDocumentId The document that is referenced
 * @returns SQL query string to insert reference into references table
 */
export function getReferencesInsertSql(documentId: string, referencedDocumentId: String): string {
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
export function getDocumentInsertOrUpdateSql(
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
    security.clientName,
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
 * Returns the SQL query for deleting references to a document from the database
 * @param documentId the document id of the references we want to delete
 * @returns SQL query string to delete references
 */
export function getDeleteReferencesSql(documentId: string): string {
  const sql = format('DELETE FROM meadowlark.references WHERE parent_document_id = (%L);', [documentId]);
  return sql;
}

// SQL for DDL

/**
 * Returns the SQL to create the meadowlark database
 * @param meadowlarkDbName the name of the database to create
 * @returns SQL query string to create the database
 */
export function getCreateDatabaseSql(meadowlarkDbName: string): string {
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
 * SQL query string to crate references table
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

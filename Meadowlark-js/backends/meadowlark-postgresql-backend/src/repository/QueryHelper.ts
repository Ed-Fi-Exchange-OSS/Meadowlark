// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import format from 'pg-format';

export function getDocumentByIdSql(documentId: string): string {
  return format(
    `
    SELECT document_id, document_identity, project_name, resource_name, resource_version,
       is_descriptor, validated, created_by, edfi_doc
       FROM meadowlark.documents
       WHERE document_id = %L;`,
    [documentId],
  );
}

export function getDocumentOwnershipByIdSql(documentId: string): string {
  return format('SELECT created_by FROM meadowlark.documents WHERE document_id = %L;', [documentId]);
}

export function getRecordExistsSql(documentId: string): string {
  return format('SELECT document_id FROM meadowlark.documents WHERE document_id = %L;', [documentId]);
}

export function deleteDocumentByIdSql(documentId: string): string {
  const sql = format(
    'with del as (DELETE FROM meadowlark.documents WHERE document_id = %L RETURNING id) SELECT COUNT(*) FROM del;',
    [documentId],
  );
  return sql;
}

export function getReferencesInsert(documentId: string, referencedDocumentId: String): string {
  const sql = format('INSERT INTO meadowlark.references (parent_document_id, referenced_document_id) VALUES (%L);', [
    documentId,
    referencedDocumentId,
  ]);
  return sql;
}

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

export function getCreateDatabaseSql(meadowlarkDbName: string): string {
  return format('CREATE DATABASE %I', meadowlarkDbName);
}

export const createSchemaSql = 'CREATE SCHEMA IF NOT EXISTS meadowlark';

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

import { DocumentReference, documentIdForDocumentReference } from '@edfi/meadowlark-core';
import format from 'pg-format';

export async function getDocumentByIdSql(documentId: string) {
  return format(
    'SELECT document_id, document_identity, project_name, resource_name, resource_version,' +
      ' is_descriptor, validated, edfi_doc' +
      ' FROM meadowlark.documents' +
      ' WHERE document_id = %L;',
    [documentId],
  );
}

export async function getRecordExistsSql(documentId: string) {
  return format('SELECT document_id FROM meadowlark.documents WHERE document_id = %L;', [documentId]);
}

export async function deleteDocumentByIdSql(documentId: string) {
  const sql = format('DELETE FROM meadowlark.documents WHERE document_id = %L', [documentId]);
  return sql;
}

export async function getDocumentInsertOrUpdateSql(
  { id, resourceInfo, documentInfo, edfiDoc, validate },
  isInsert: boolean,
): Promise<string> {
  const outRefs = documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr));

  const documentValues = [
    id,
    JSON.stringify(documentInfo.documentIdentity),
    resourceInfo.projectName,
    resourceInfo.resourceName,
    resourceInfo.resourceVersion,
    resourceInfo.isDescriptor,
    validate,
    edfiDoc,
    outRefs,
  ];

  let documentSql;

  if (isInsert) {
    documentSql = format(
      'INSERT INTO meadowlark.documents' +
        ' (document_id, document_identity, project_name, resource_name, resource_version, is_descriptor, validated, edfi_doc)' +
        ' VALUES (%L)' +
        ' RETURNING document_id;',
      documentValues,
    );
  } else {
    documentSql = format(
      'UPDATE meadowlark.documents' +
        ' SET' +
        ' document_id = %L,' +
        ' document_identity = %L,' +
        ' project_name = %L,' +
        ' resource_name = %L,' +
        ' resource_version = %L,' +
        ' is_descriptor = %L,' +
        ' validated = %L,' +
        ' edfi_doc = %L' +
        ' WHERE meadowlark.documents.document_id = %1$L;',
      documentValues[0],
      documentValues[1],
      documentValues[2],
      documentValues[3],
      documentValues[4],
      documentValues[5],
      documentValues[6],
      documentValues[7],
    );
  }
  return documentSql;
}

export function GetCreateDatabaseSql(meadowlarkDbName: string) {
  return format('CREATE DATABASE %I', meadowlarkDbName);
}

export const createSchemaSql = 'CREATE SCHEMA IF NOT EXISTS meadowlark';

export const createDocumentTableSql =
  'CREATE TABLE IF NOT EXISTS meadowlark.documents(' +
  'id bigserial PRIMARY KEY,' +
  'document_id VARCHAR(56) NOT NULL,' +
  'document_identity JSONB NOT NULL,' +
  'project_name VARCHAR NOT NULL,' +
  'resource_name VARCHAR NOT NULL,' +
  'resource_version VARCHAR NOT NULL,' +
  'is_descriptor boolean NOT NULL,' +
  'validated boolean NOT NULL,' +
  'edfi_doc JSONB NOT NULL);';

export const createReferencesTableSql =
  'CREATE TABLE IF NOT EXISTS meadowlark.references(' +
  'id bigserial PRIMARY KEY,' +
  'parent_document_id VARCHAR NOT NULL,' +
  'referenced_document_id VARCHAR NOT NULL);';

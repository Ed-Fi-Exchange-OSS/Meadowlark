// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, Db, MongoClient, WithId } from 'mongodb';
import { ForeignKeyItem } from '../../model/ForeignKeyItem';
import { EntityInfo } from '../../model/EntityInfo';
import { Security } from '../../model/Security';
import { ValidationOptions } from '../../model/ValidationOptions';
import { DeleteResult } from '../../plugin/backend/DeleteResult';
import { GetResult } from '../../plugin/backend/GetResult';
import { PutResult } from '../../plugin/backend/PutResult';
import { OwnershipResult } from '../../plugin/backend/OwnershipResult';
import { PaginationParameters } from '../../plugin/backend/PaginationParameters';
import { SearchResult } from '../../plugin/backend/SearchResult';

interface Entity {
  // A string hash of the project name, entity type, entity version and body of
  // the API document. This is identical to PK identifier in the DynamoDB
  // implementation. This field will be a unique index on the collection.
  id: string;

  // The MetaEd project name the entity is defined in e.g. "EdFi" for a data standard entity.
  project_name: String;

  // The entity type as a string e.g. "Student".
  entity_type: String;

  // The entity version as a string. This is the same as MetaEd project version
  // the entity is defined in e.g. "3.3.1-b" for a 3.3b data standard entity.
  entity_version: String;

  // The ODS/API document body as a sub-document.
  api_doc: any;

  // An array of _ids extracted from the ODS/API document body for all externally
  // referenced documents.
  out_refs: string[];
}

async function naiveGetEntities(): Promise<Collection<Entity>> {
  const client = new MongoClient('mongodb://localhost:27017');

  await client.connect();
  const db: Db = client.db('meadowlark');
  const entities: Collection<Entity> = db.collection('entities');

  // Note this will trigger a time-consuming index build if the indexes do not already exist.
  entities.createIndex({ id: 1 }, { unique: true });
  entities.createIndex({ out_refs: 1 });

  return entities;
}

export async function createEntity(
  id: string,
  entityInfo: EntityInfo,
  info: object,
  _validationOptions: ValidationOptions,
  _security: Security,
  _lambdaRequestId: string,
): Promise<PutResult> {
  const entities: Collection<Entity> = await naiveGetEntities();

  const entity: Entity = {
    id,
    project_name: entityInfo.projectName,
    entity_type: entityInfo.entityName,
    entity_version: entityInfo.projectVersion,
    api_doc: info,
    out_refs: [], // TODO
  };

  try {
    await entities.insertOne(entity);
  } catch (e) {
    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
  return { result: 'INSERT_SUCCESS' };
}

export async function getEntityById(
  _entityInfo: EntityInfo,
  id: string,
  _security: Security,
  _lambdaRequestId: string,
): Promise<GetResult> {
  const entities = await naiveGetEntities();

  try {
    const result: WithId<Entity> | null = await entities.findOne({ id });
    if (result === null) return { result: 'NOT_FOUND', documents: [] };
    return { result: 'SUCCESS', documents: [{ id: result.id, ...result.api_doc }] };
  } catch (e) {
    return { result: 'ERROR', documents: [] };
  }
}

export async function getEntityList(_entityInfo: EntityInfo, _lambdaRequestId: string): Promise<GetResult> {
  return { result: 'ERROR', documents: [] };
}

export async function updateEntityById(
  _id: string,
  _entityInfo: EntityInfo,
  _info: object,
  _validationOptions: ValidationOptions,
  _security: Security,
  _lambdaRequestId: string,
): Promise<PutResult> {
  return { result: 'UNKNOWN_FAILURE', failureMessage: 'Not Implemented' };
}

export async function deleteEntityById(
  _id: string,
  _entityInfo: EntityInfo,
  _lambdaRequestId: string,
): Promise<DeleteResult> {
  return { success: false };
}

export async function getReferencesToThisItem(
  _id: string,
  _entityInfo: EntityInfo,
  _lambdaRequestId: string,
): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> {
  return { success: false, foreignKeys: [] };
}

export async function getForeignKeyReferences(
  _id: string,
  _entityInfo: EntityInfo,
  _lambdaRequestId: string,
): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> {
  return { success: false, foreignKeys: [] };
}

export async function deleteItems(_items: { pk: string; sk: string }[], _awsRequestId: string): Promise<DeleteResult> {
  return { success: false };
}

export async function validateEntityOwnership(
  _id: string,
  _entityInfo: EntityInfo,
  _clientName: string | null,
  _lambdaRequestId: string,
): Promise<OwnershipResult> {
  return { result: 'ERROR', isOwner: false };
}

export async function queryEntityList(
  _entityInfo: EntityInfo,
  _queryStringParameters: object,
  _paginationParameters: PaginationParameters,
  _awsRequestId: string,
): Promise<SearchResult> {
  return { success: false, results: [] };
}

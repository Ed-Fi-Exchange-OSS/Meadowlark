// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, Db, MongoClient } from 'mongodb';
import { EntityInfo, Security, ValidationOptions, PutResult } from '@edfi/meadowlark-core';
import { Entity } from '../model/Entity';

async function naiveGetEntities(): Promise<Collection<Entity>> {
  const client = new MongoClient('mongodb://mongo1:27017,mongo2:27018,mongo3:27019');

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
    edfi_doc: info,
    out_refs: [], // TODO
  };

  try {
    await entities.insertOne(entity);
  } catch (e) {
    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  }
  return { result: 'INSERT_SUCCESS' };
}

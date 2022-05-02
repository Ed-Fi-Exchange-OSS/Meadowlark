// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, Db, MongoClient, WithId } from 'mongodb';
import { DocumentInfo, Security, GetResult } from '@edfi/meadowlark-core';
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

export async function getEntityById(
  _documentInfo: DocumentInfo,
  id: string,
  _security: Security,
  _lambdaRequestId: string,
): Promise<GetResult> {
  const entities = await naiveGetEntities();

  try {
    const result: WithId<Entity> | null = await entities.findOne({ id });
    if (result === null) return { result: 'NOT_FOUND', documents: [] };
    return { result: 'SUCCESS', documents: [{ id: result.id, ...result.edfi_doc }] };
  } catch (e) {
    return { result: 'ERROR', documents: [] };
  }
}

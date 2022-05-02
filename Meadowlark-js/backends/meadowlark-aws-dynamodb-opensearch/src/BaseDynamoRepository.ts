// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import invariant from 'invariant';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  ForeignKeyItem,
  DocumentReference,
  documentIdForEntityInfo,
  documentIdFromNaturalKeyString,
  EntityInfo,
  entityTypeStringFrom,
  entityTypeStringFromComponents,
  buildNKString,
  EntityIdentifyingInfo,
  EntityTypeInfo,
  Logger,
} from '@edfi/meadowlark-core';
import { PutItemInputAttributeMap, TransactWriteItem } from './types/AwsSdkLibDynamoDb';

// setup to switch between local and cloud dynamodb based on stage flag
export const dynamoOpts: any = {};
if (process.env.STAGE === 'local') {
  dynamoOpts.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT;
  dynamoOpts.region = 'local/us-east-1';
  dynamoOpts.logger = Logger;
}

export const tableOpts: any = {
  tableName: process.env.DOMAIN_TABLE_NAME ?? 'DefaultTableName',
};

let dynamoDBClient: DynamoDBClient | null = null;

export function getDynamoDBClient(): DynamoDBClient {
  if (dynamoDBClient == null) dynamoDBClient = new DynamoDBClient(dynamoOpts);
  return dynamoDBClient;
}

let dynamoDBDocumentClient: DynamoDBDocumentClient | null = null;

export function getDynamoDBDocumentClient(): DynamoDBDocumentClient {
  if (dynamoDBDocumentClient == null) dynamoDBDocumentClient = DynamoDBDocumentClient.from(getDynamoDBClient());
  return dynamoDBDocumentClient;
}

export function entityIdPrefixRemoved(prefixedId: string): string {
  invariant(prefixedId.startsWith('ID#'), `prefixedId ${prefixedId} must start with "ID#"`);
  return prefixedId.replace(/^ID#/, '');
}

export function sortKeyFromId(id: string): string {
  invariant(!id.startsWith('ID#'), `id ${id} shouldn't start with "ID#"`);
  return `ID#${id}`;
}

export function assignableSortKeyFromId(id: string): string {
  invariant(!id.startsWith('ID#'), `id ${id} shouldn't start with "ID#"`);
  return `ASSIGN#ID#${id}`;
}

export function sortKeyFromEntityIdentity(entityInfo: EntityInfo): string {
  return sortKeyFromId(documentIdForEntityInfo(entityInfo));
}

export function conditionCheckFrom(entityIdentifyingInfo: EntityIdentifyingInfo) {
  invariant(
    entityIdentifyingInfo.naturalKey.startsWith('NK#'),
    `entityIdentifyingInfo.naturalKey "${entityIdentifyingInfo.naturalKey}" did not start with "NK#"`,
  );
  return {
    ConditionCheck: {
      TableName: tableOpts.tableName,
      Key: {
        pk: entityTypeStringFrom(entityIdentifyingInfo),
        sk: sortKeyFromId(documentIdFromNaturalKeyString(entityIdentifyingInfo.naturalKey)),
      },
      ConditionExpression: 'attribute_exists(sk)',
    },
  };
}

export function conditionCheckFromAssignable(assignableToTypeInfo: EntityTypeInfo, foreignKey: DocumentReference) {
  invariant(
    foreignKey.constraintKey.startsWith('NK#'),
    `foreignKey.constraintKey "${foreignKey.constraintKey}" did not start with "NK#"`,
  );
  return {
    ConditionCheck: {
      TableName: tableOpts.tableName,
      Key: {
        pk: entityTypeStringFrom(assignableToTypeInfo),
        sk: assignableSortKeyFromId(documentIdFromNaturalKeyString(foreignKey.constraintKey)),
      },
      ConditionExpression: 'attribute_exists(sk)',
    },
  };
}

export function foreignKeyConditions(entityInfo: EntityInfo): TransactWriteItem[] {
  return entityInfo.foreignKeys.map((foreignKey) => {
    const entityTypeInfo: EntityTypeInfo = {
      // TODO: Note for the future, this assumes the referenced entity is in the same project/namespace as the referring one
      projectName: entityInfo.projectName,
      projectVersion: entityInfo.projectVersion,
      entityName: foreignKey.metaEdName,
      isDescriptor: false,
    };

    if (foreignKey.isAssignableFrom) {
      return conditionCheckFromAssignable(entityTypeInfo, foreignKey);
    }

    return conditionCheckFrom({
      ...entityTypeInfo,
      naturalKey: buildNKString(foreignKey.constraintKey),
    });
  });
}

export function descriptorValueConditions(entityInfo: EntityInfo): TransactWriteItem[] {
  return entityInfo.descriptorValues.map((descriptorValue) =>
    conditionCheckFrom({
      // TODO: Note for the future, this assumes the referenced descriptor is in the same project/namespace as the referring entity
      projectName: entityInfo.projectName,
      projectVersion: entityInfo.projectVersion,
      entityName: descriptorValue.metaEdName,
      isDescriptor: true,
      naturalKey: buildNKString(descriptorValue.constraintKey),
    }),
  );
}

/*
 * Builds the attribute map for a PUT request, including additional fields for authorization.
 */
export function constructPutEntityItem(
  id: string,
  entityInfo: EntityInfo,
  info: object,
  ownerId: string | null,
  referenceValidation: boolean,
): PutItemInputAttributeMap {
  const infoWithMetadata = referenceValidation ? info : { ...info, _unvalidated: true };

  // Start constructing the Entity item
  const putItem: PutItemInputAttributeMap = {
    pk: entityTypeStringFrom(entityInfo),
    sk: sortKeyFromId(id),
    naturalKey: entityInfo.naturalKey,
    info: infoWithMetadata,
  };

  if (ownerId != null) putItem.ownerId = ownerId;

  // Potential security contexts for all entities
  if (entityInfo.studentId != null) putItem.studentId = entityInfo.studentId;
  if (entityInfo.edOrgId != null) putItem.edOrgId = entityInfo.edOrgId;

  // Security relationships for relevant associations
  if (entityInfo.entityName === 'StudentEducationOrganizationAssociation') {
    putItem.securityStudentId = `Student#${entityInfo.studentId}`;
    putItem.securityEdOrgId = `StudentEducationOrganizationAssociation#${entityInfo.edOrgId}`;
  }
  if (entityInfo.entityName === 'StudentSchoolAssociation') {
    putItem.securityStudentId = `Student#${entityInfo.studentId}`;
    putItem.securityEdOrgId = `StudentSchoolAssociation#${entityInfo.edOrgId}`;
  }

  return putItem;
}

/*
 * Returns the attribute map to PUT an assignable item if applicable, null otherwise
 */
export function constructAssignablePutItem(entityInfo: EntityInfo): TransactWriteItem | null {
  if (entityInfo.assignableInfo == null) return null;

  // TODO: Note for the future, this assumes the "assignable to" entity is in the same project/namespace as the given entity
  const assignableToType = entityTypeStringFromComponents(
    entityInfo.projectName,
    entityInfo.projectVersion,
    entityInfo.assignableInfo.assignableToName,
  );

  return {
    Put: {
      TableName: tableOpts.tableName,
      Item: {
        pk: assignableToType,
        sk: assignableSortKeyFromId(documentIdFromNaturalKeyString(entityInfo.assignableInfo.assignableNaturalKey)),
      },
      ConditionExpression: 'attribute_not_exists(sk)',
    },
  };
}

/*
 * Returns the attribute map to DELETE an assignable item if applicable, null otherwise
 */
export function constructAssignableDeleteItem(id: string, entityInfo: EntityInfo): TransactWriteItem | null {
  if (entityInfo.assignableInfo == null) return null;

  // TODO: Note for the future, this assumes the "assignable to" entity is in the same project/namespace as the given entity
  const assignableToType = entityTypeStringFromComponents(
    entityInfo.projectName,
    entityInfo.projectVersion,
    entityInfo.assignableInfo.assignableToName,
  );

  return {
    Delete: {
      TableName: tableOpts.tableName,
      Key: {
        pk: assignableToType,
        sk: assignableSortKeyFromId(id),
      },
    },
  };
}

/*
 * Construct the action to put the Entity item, failing on the condition it already exists
 */
export function generatePutEntityThatFailsIfExists(item: PutItemInputAttributeMap): TransactWriteItem {
  return {
    Put: {
      TableName: tableOpts.tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(sk)',
    },
  };
}

/*
 * Construct the action to put or replace an Entity item
 */
export function generatePutEntityForUpsert(item: PutItemInputAttributeMap): TransactWriteItem {
  return {
    Put: {
      TableName: tableOpts.tableName,
      Item: item,
    },
  };
}

/*
 * Creates an array of reference information for use in creating foreign key reference items in Dynamo.
 */
export function generateReferenceItems(naturalKeyHash: string, item: EntityInfo): TransactWriteItem[] {
  const collection: TransactWriteItem[] = [];
  const referenceType = entityTypeStringFromComponents(item.projectName, item.projectVersion, item.entityName);
  const { naturalKey } = item;

  const extractReferences = R.forEach((reference: DocumentReference) => {
    const referenceId = sortKeyFromId(documentIdFromNaturalKeyString(reference.constraintKey));

    const fk = new ForeignKeyItem({
      From: naturalKeyHash,
      To: referenceId,
      Description: {
        Type: referenceType,
        NaturalKey: naturalKey,
      },
    });

    collection.push(generatePutEntityForUpsert(fk.generateFromToItem()));
    collection.push(generatePutEntityForUpsert(fk.generateToFromItem()));
  });

  extractReferences(item.foreignKeys);

  return collection;
}

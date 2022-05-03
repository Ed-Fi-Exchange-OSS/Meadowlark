// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { invariant } from 'ts-invariant';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  ForeignKeyItem,
  DocumentElement,
  DocumentReference,
  DocumentIdentity,
  documentIdForEntityInfo,
  idFromDocumentElements,
  DocumentInfo,
  DocumentIdentifyingInfo,
  DocumentTypeInfo,
  Logger,
  entityTypeStringFrom,
  entityTypeStringFromComponents,
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

export function buildNKString(naturalKey: string): string {
  if (naturalKey.startsWith('NK#')) return naturalKey;

  return `NK#${naturalKey}`;
}

/**
 * Converts document identity to string in DynamoDB natual key form
 * For example, converts:
 * [{name: 'classPeriodName', value: 'z1'}, {name: 'schoolId', value: '24'}, {name: 'studentId', value: '333'}]
 * to 'NK#classPeriodName=z1#schoolId=24#studentId=333'
 */
export function dynamoIdentityToString(documentIdentity: DocumentIdentity): string {
  const stringifiedValues: string[] = documentIdentity.map((element: DocumentElement) => `${element.name}=${element.value}`);
  return `NK#${stringifiedValues.join('#')}`;
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

export function sortKeyFromEntityIdentity(documentInfo: DocumentInfo): string {
  return sortKeyFromId(documentIdForEntityInfo(documentInfo));
}

export function conditionCheckFrom(entityIdentifyingInfo: DocumentIdentifyingInfo) {
  return {
    ConditionCheck: {
      TableName: tableOpts.tableName,
      Key: {
        pk: entityTypeStringFrom(entityIdentifyingInfo),
        sk: sortKeyFromId(idFromDocumentElements(entityIdentifyingInfo.documentIdentity)),
      },
      ConditionExpression: 'attribute_exists(sk)',
    },
  };
}

export function conditionCheckFromAssignable(assignableToTypeInfo: DocumentTypeInfo, documentIdentity: DocumentIdentity) {
  return {
    ConditionCheck: {
      TableName: tableOpts.tableName,
      Key: {
        pk: entityTypeStringFrom(assignableToTypeInfo),
        sk: assignableSortKeyFromId(idFromDocumentElements(documentIdentity)),
      },
      ConditionExpression: 'attribute_exists(sk)',
    },
  };
}

export function foreignKeyConditions(documentInfo: DocumentInfo): TransactWriteItem[] {
  return documentInfo.documentReferences.map((documentReference) => {
    const entityTypeInfo: DocumentTypeInfo = {
      // TODO: Note for the future, this assumes the referenced entity is in the same project/namespace as the referring one
      projectName: documentInfo.projectName,
      projectVersion: documentInfo.projectVersion,
      entityName: documentReference.metaEdName,
      isDescriptor: false,
    };

    if (documentReference.isAssignableFrom) {
      return conditionCheckFromAssignable(entityTypeInfo, documentReference.documentIdentity);
    }

    return conditionCheckFrom({
      ...entityTypeInfo,
      documentIdentity: documentReference.documentIdentity,
    });
  });
}

export function descriptorValueConditions(documentInfo: DocumentInfo): TransactWriteItem[] {
  return documentInfo.descriptorValues.map((descriptorValue) =>
    conditionCheckFrom({
      // TODO: Note for the future, this assumes the referenced descriptor is in the same project/namespace as the referring entity
      projectName: documentInfo.projectName,
      projectVersion: documentInfo.projectVersion,
      entityName: descriptorValue.metaEdName,
      isDescriptor: true,
      documentIdentity: descriptorValue.documentIdentity,
    }),
  );
}

/*
 * Builds the attribute map for a PUT request, including additional fields for authorization.
 */
export function constructPutEntityItem(
  id: string,
  documentInfo: DocumentInfo,
  info: object,
  ownerId: string | null,
  referenceValidation: boolean,
): PutItemInputAttributeMap {
  const infoWithMetadata = referenceValidation ? info : { ...info, _unvalidated: true };

  // Start constructing the Entity item
  const putItem: PutItemInputAttributeMap = {
    pk: entityTypeStringFrom(documentInfo),
    sk: sortKeyFromId(id),
    naturalKey: dynamoIdentityToString(documentInfo.documentIdentity),
    info: infoWithMetadata,
  };

  if (ownerId != null) putItem.ownerId = ownerId;

  // Potential security contexts for all entities
  if (documentInfo.studentId != null) putItem.studentId = documentInfo.studentId;
  if (documentInfo.edOrgId != null) putItem.edOrgId = documentInfo.edOrgId;

  // Security relationships for relevant associations
  if (documentInfo.entityName === 'StudentEducationOrganizationAssociation') {
    putItem.securityStudentId = `Student#${documentInfo.studentId}`;
    putItem.securityEdOrgId = `StudentEducationOrganizationAssociation#${documentInfo.edOrgId}`;
  }
  if (documentInfo.entityName === 'StudentSchoolAssociation') {
    putItem.securityStudentId = `Student#${documentInfo.studentId}`;
    putItem.securityEdOrgId = `StudentSchoolAssociation#${documentInfo.edOrgId}`;
  }

  return putItem;
}

/*
 * Returns the attribute map to PUT an assignable item if applicable, null otherwise
 */
export function constructAssignablePutItem(documentInfo: DocumentInfo): TransactWriteItem | null {
  if (documentInfo.assignableInfo == null) return null;

  // TODO: Note for the future, this assumes the "assignable to" entity is in the same project/namespace as the given entity
  const assignableToType = entityTypeStringFromComponents(
    documentInfo.projectName,
    documentInfo.projectVersion,
    documentInfo.assignableInfo.assignableToName,
  );

  return {
    Put: {
      TableName: tableOpts.tableName,
      Item: {
        pk: assignableToType,
        sk: assignableSortKeyFromId(idFromDocumentElements(documentInfo.assignableInfo.assignableIdentity)),
      },
      ConditionExpression: 'attribute_not_exists(sk)',
    },
  };
}

/*
 * Returns the attribute map to DELETE an assignable item if applicable, null otherwise
 */
export function constructAssignableDeleteItem(id: string, documentInfo: DocumentInfo): TransactWriteItem | null {
  if (documentInfo.assignableInfo == null) return null;

  // TODO: Note for the future, this assumes the "assignable to" entity is in the same project/namespace as the given entity
  const assignableToType = entityTypeStringFromComponents(
    documentInfo.projectName,
    documentInfo.projectVersion,
    documentInfo.assignableInfo.assignableToName,
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
export function generateReferenceItems(naturalKeyHash: string, item: DocumentInfo): TransactWriteItem[] {
  const collection: TransactWriteItem[] = [];
  const referenceType = entityTypeStringFromComponents(item.projectName, item.projectVersion, item.entityName);

  const extractReferences = R.forEach((documentReference: DocumentReference) => {
    const referenceId = sortKeyFromId(idFromDocumentElements(documentReference.documentIdentity));

    const fk = new ForeignKeyItem({
      From: naturalKeyHash,
      To: referenceId,
      Description: {
        Type: referenceType,
        NaturalKey: dynamoIdentityToString(item.documentIdentity),
      },
    });

    collection.push(generatePutEntityForUpsert(fk.generateFromToItem()));
    collection.push(generatePutEntityForUpsert(fk.generateToFromItem()));
  });

  extractReferences(item.documentReferences);

  return collection;
}

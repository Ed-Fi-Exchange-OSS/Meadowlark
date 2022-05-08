// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as R from 'ramda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
  TransactWriteCommand,
  TransactWriteCommandInput,
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { ExecuteStatementCommand } from '@aws-sdk/client-dynamodb';
import { Logger, GetResult, UpdateResult, UpsertResult, Security, DocumentInfo } from '@edfi/meadowlark-core';
import {
  getDynamoDBDocumentClient,
  entityIdPrefixRemoved,
  foreignKeyConditions,
  sortKeyFromId,
  tableOpts,
  descriptorValueConditions,
  generateReferenceItems,
  constructPutEntityItem,
  generatePutEntityThatFailsIfExists,
  constructAssignablePutItem,
  constructAssignableDeleteItem,
  getDynamoDBClient,
} from './BaseDynamoRepository';
import { NoOutput, TransactWriteItem } from './types/AwsSdkLibDynamoDb';
import { ForeignKeyItem } from './model/ForeignKeyItem';
import { OwnershipResult } from './model/OwnershipResult';
import { entityTypeStringFrom } from './Utility';

export type DynamoDeleteResult = { success: boolean };
type NextToken = string;

/**
 * Entry point for "get all" style query in DynamoDB. Querys by the entity type.
 */
export async function getEntityList(documentTypeInfo: DocumentInfo, traceId: string): Promise<GetResult> {
  Logger.debug(`DynamoEntityRepository.getEntityList for ${documentTypeInfo.resourceName}`, traceId);

  const queryParams: QueryCommandInput = {
    TableName: tableOpts.tableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': entityTypeStringFrom(documentTypeInfo),
    },
  };

  try {
    const queryResult: QueryCommandOutput = await getDynamoDBDocumentClient().send(new QueryCommand(queryParams));

    // TODO: there is a bug here because it doesn't deal with paging. If the results are > 1 MB then there will be another
    // page and another Query Command needs to be executed. If we change to ElasticSearch then this is not a big deal. But if
    // we leave this in Dynamo then we need to fix the bug. RND-183.

    return {
      result: 'SUCCESS',
      documents: Array.from(queryResult.Items ?? []).map((item) => ({ id: entityIdPrefixRemoved(item.sk), ...item.info })),
    };
  } catch (error) {
    Logger.error(`DynamoEntityRepository.getEntityList`, traceId, '', error);
    return { result: 'ERROR', documents: [] };
  }
}

/**
 * Queries the SecurityStudentEdOrgGSI for all education organization ids associated with a student through
 * a given Association entity in the Ed-Fi model e.g. StudentSchoolAssociation
 */
async function edOrgsForStudent(
  throughAssociation: string,
  studentId: string,
  edOrgIds: string[],
  traceId: string,
): Promise<string[]> {
  const securityEdOrgPrefix = `${throughAssociation}#`;
  const queryParams: QueryCommandInput = {
    TableName: tableOpts.tableName,
    IndexName: 'SecurityStudentEdOrgGSI',
    KeyConditionExpression: 'securityStudentId = :securityStudentId and begins_with(securityEdOrgId, :securityEdOrgId)',
    ExpressionAttributeValues: {
      ':securityStudentId': `Student#${studentId}`,
      ':securityEdOrgId': securityEdOrgPrefix,
    },
  };

  let queryResult: QueryCommandOutput = NoOutput;

  try {
    queryResult = await getDynamoDBDocumentClient().send(new QueryCommand(queryParams));
  } catch (error) {
    Logger.error(`DynamoEntityRepository.edOrgsForStudent`, traceId, '', error);
    return [];
  }

  const edOrgIdHits: string[] = Array.from(queryResult.Items ?? []).map((item) =>
    (item.securityEdOrgId as string).replace(securityEdOrgPrefix, ''),
  );

  return R.intersection(edOrgIdHits, edOrgIds);
}

/**
 * Entry point for "get bv id" style query in DynamoDB. Querys by the entity type and id.
 *
 * If security is enabled, check the Entity item returned by DynamoDB for EdOrg and/or
 * Student relationships.  If they exist, only return the result if it matches
 * the claims in the Security object.
 */
export async function getEntityById(
  documentInfo: DocumentInfo,
  id: string,
  security: Security,
  traceId: string,
): Promise<GetResult> {
  Logger.debug(`DynamoEntityRepository.getEntityById for ${id}`, traceId);

  const getParams: GetCommandInput = {
    TableName: tableOpts.tableName,
    Key: {
      pk: entityTypeStringFrom(documentInfo),
      sk: sortKeyFromId(id),
    },
  };

  let getResult: GetCommandOutput = NoOutput;

  try {
    getResult = await getDynamoDBDocumentClient().send(new GetCommand(getParams));
  } catch (error) {
    Logger.error(`DynamoEntityRepository.getEntityById ${error}`, traceId, '', error);
    return { result: 'ERROR', documents: [] };
  }

  if (getResult.Item == null) return { result: 'NOT_FOUND', documents: [] };

  const documents = [{ id: entityIdPrefixRemoved(getResult.Item.sk), ...getResult.Item.info }];

  // Ownership-based security takes precedence
  if (security.isOwnershipEnabled) {
    if (getResult.Item.ownerId == null) {
      Logger.debug('DynamoEntityRepository.getEntityById: No ownership of item', traceId);
      return { result: 'SUCCESS', documents, securityResolved: ['No ownership of item'] };
    }

    if (security.clientName !== getResult.Item.ownerId) {
      Logger.debug(
        `DynamoEntityRepository.getEntityById: Ownership match failure - client ${security.clientName} access item owned by ${getResult.Item.ownerId}`,
        traceId,
      );
      return { result: 'AUTHORIZATION_FAILURE', documents: [], securityResolved: ['Ownership match failure'] };
    }

    Logger.debug(`DynamoEntityRepository.getEntityById: Ownership match - client ${security.clientName}`, traceId);
    return { result: 'SUCCESS', documents, securityResolved: ['Ownership matches'] };
  }

  // no security if no legacy claims (for demo/testing reasons)
  if (security.edOrgIds.length === 0 && security.studentIds.length === 0)
    return { result: 'SUCCESS', documents, securityResolved: ['Security inactive without claims'] };

  const securityResolved: string[] = [];

  // unsecured by edorg/student security
  if (getResult.Item.edOrgId == null && getResult.Item.studentId == null) {
    return { result: 'SUCCESS', documents, securityResolved: ['Entity not secured by EdOrgId or StudentId'] };
  }

  // ed org direct security
  if (getResult.Item.edOrgId != null && getResult.Item.studentId == null) {
    if (security.edOrgIds.includes(getResult.Item.edOrgId)) {
      return { result: 'SUCCESS', documents, securityResolved: [`Direct via EdOrgId ${getResult.Item.edOrgId}`] };
    }
    return {
      result: 'LEGACY_AUTHORIZATION_FAILURE',
      documents: [],
      securityResolved: [`No access via EdOrgId ${getResult.Item.edOrgId}`],
    };
  }

  // student direct security
  if (security.studentIds.includes(getResult.Item.studentId)) {
    securityResolved.push(`Direct via StudentId ${getResult.Item.studentId}`);
    return { result: 'SUCCESS', documents, securityResolved };
  }
  securityResolved.push(`No access via StudentId ${getResult.Item.studentId}`);

  // student indirect security
  if (security.throughAssociation != null) {
    const edOrgsFound: string[] = await edOrgsForStudent(
      security.throughAssociation,
      getResult.Item.studentId,
      security.edOrgIds,
      traceId,
    );
    if (edOrgsFound.length > 0) {
      securityResolved.push(
        `StudentId ${getResult.Item.studentId} relationship with EdOrgId ${edOrgsFound.join(',')} through ${
          security.throughAssociation
        } `,
      );
      return { result: 'SUCCESS', documents, securityResolved };
    }
    securityResolved.push(`No relationship through ${security.throughAssociation}`);
  }

  return { result: 'LEGACY_AUTHORIZATION_FAILURE', documents: [], securityResolved };
}

/**
 * Entry point for entity update in DynamoDB. Takes the entity id, JSON body and key information
 * extracted from the body, and attempts a DynamoDB update.
 */
export async function updateEntityById(
  id: string,
  documentInfo: DocumentInfo,
  info: object,
  validate: boolean,
  security: Security,
  traceId: string,
): Promise<UpdateResult> {
  Logger.debug(`DynamoEntityRepository.updateEntityById for ${JSON.stringify(documentInfo.documentIdentity)}`, traceId);
  const infoWithMetadata = validate ? info : { ...info, _unvalidated: true };

  // Construct the action to update the Entity item
  const ExpressionAttributeValues = { ':info': infoWithMetadata };

  // Natural key must not have been changed, and natural key maps to id/sk
  let ConditionExpression = 'attribute_exists(sk)';

  // Placeholder for optional ownership-based security
  let ExpressionAttributeNames;

  // Additional conditions if ownership-based security is enabled
  if (security.isOwnershipEnabled) {
    ExpressionAttributeNames = { '#ownerId': 'ownerId' };
    ExpressionAttributeValues[':ownerId'] = security.clientName;
    ConditionExpression += ' AND (attribute_not_exists(ownerId) OR #ownerId = :ownerId)';
  }

  const updateEntity: TransactWriteItem = {
    Update: {
      TableName: tableOpts.tableName,
      Key: {
        pk: entityTypeStringFrom(documentInfo),
        sk: sortKeyFromId(id),
      },
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ConditionExpression,
      UpdateExpression: `set info = :info`,
    },
  };

  // Construct foreign key condition checks if reference validation is on
  const checkForeignKeys: TransactWriteItem[] = validate ? foreignKeyConditions(documentInfo) : [];
  // Construct descriptor value condition checks if descriptor validation is on
  const checkDescriptorValues: TransactWriteItem[] = validate ? descriptorValueConditions(documentInfo) : [];

  // Put all the actions together in order, as a single transaction
  const transactParams: TransactWriteCommandInput = {
    TransactItems: [...checkForeignKeys, ...checkDescriptorValues, updateEntity],
  };

  try {
    await getDynamoDBDocumentClient().send(new TransactWriteCommand(transactParams));
  } catch (error) {
    if (error?.name === 'TransactionCanceledException') {
      // CancellationReasons provides imperfect information, but better than nothing
      const failureIndex = error.CancellationReasons.findIndex((reason) => reason.Code !== 'None');

      if (failureIndex === error.CancellationReasons.length - 1)
        // failure was with the update itself - not exists or denied by security rules
        return {
          result: 'UPDATE_FAILURE_NOT_EXISTS',
          failureMessage: `The resource with id ${id} does not exist.`,
        };

      if (error.CancellationReasons.length > 1) {
        const submittedForeignKeysLength = validate ? documentInfo.documentReferences.length : 0;
        if (failureIndex < submittedForeignKeysLength) {
          // failure was with one of the foreign key condition check actions
          const failureForeignKey = documentInfo.documentReferences[failureIndex];
          return {
            result: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `Foreign key constraint failure for entity ${
              failureForeignKey.resourceName
            }. Expected natural key was ${JSON.stringify(failureForeignKey.documentIdentity)}`,
          };
        }
        if (failureIndex - submittedForeignKeysLength < documentInfo.descriptorReferences.length) {
          // failure was with one of the descriptor condition check actions
          const failureDescriptorValue = documentInfo.descriptorReferences[failureIndex - submittedForeignKeysLength];
          return {
            result: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `${JSON.stringify(
              failureDescriptorValue.documentIdentity,
            )} is not a valid value for descriptor ${failureDescriptorValue.resourceName}.`,
          };
        }
      }
    } else {
      Logger.error(`DynamoEntityRepository.updateEntityById`, traceId, error);
      return { result: 'UNKNOWN_FAILURE' };
    }
  }
  return { result: 'UPDATE_SUCCESS' };
}

/**
 * Entry point for entity creation in DynamoDB. Takes the entity id, JSON body and key information
 * extracted from the body, and attempts a DynamoDB insert. Falls back to DynamoDB update if ID exists.
 */
export async function createEntity(
  id: string,
  documentInfo: DocumentInfo,
  info: object,
  validate: boolean,
  security: Security,
  traceId: string,
): Promise<UpsertResult> {
  Logger.debug(`DynamoEntityRepository.createEntity for ${JSON.stringify(documentInfo.documentIdentity)}`, traceId);
  const putItem = constructPutEntityItem(id, documentInfo, info, security.clientName, validate);
  const tryPutEntity: TransactWriteItem = generatePutEntityThatFailsIfExists(putItem);

  // Construct foreign key condition checks if reference validation is on
  const checkForeignKeys: TransactWriteItem[] = validate ? foreignKeyConditions(documentInfo) : [];
  // Construct descriptor value condition checks if descriptor validation is on
  const checkDescriptorValues: TransactWriteItem[] = validate ? descriptorValueConditions(documentInfo) : [];

  // Put all the actions together in order
  const transactItems: TransactWriteItem[] = [...checkForeignKeys, ...checkDescriptorValues, tryPutEntity];

  // if entity info is assignable, add an assignable item
  const assignableItem: TransactWriteItem | null = constructAssignablePutItem(documentInfo);
  if (assignableItem != null) transactItems.push(assignableItem);

  try {
    Logger.debug(`DynamoEntityRepository.createEntity Transacting key checks and item put request`, traceId);
    await getDynamoDBDocumentClient().send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (error) {
    if (error?.name === 'TransactionCanceledException') {
      // CancellationReasons provides imperfect information, but better than nothing
      const failureIndex = error.CancellationReasons.findIndex((reason) => reason.Code !== 'None');

      const tryPutEntityIndex =
        assignableItem == null ? error.CancellationReasons.length - 1 : error.CancellationReasons.length - 2;
      if (failureIndex === tryPutEntityIndex) {
        // Entity already exists, try as update
        return updateEntityById(id, documentInfo, info, validate, security, traceId) as unknown as UpsertResult;
      }

      const hasForeignKeyOrDescriptorChecks: boolean = checkForeignKeys.length > 0 || checkDescriptorValues.length > 0;
      if (hasForeignKeyOrDescriptorChecks) {
        const submittedForeignKeysLength = validate ? documentInfo.documentReferences.length : 0;
        if (failureIndex < submittedForeignKeysLength) {
          // failure was with one of the foreign key condition check actions
          const failureForeignKey = documentInfo.documentReferences[failureIndex];
          return {
            result: 'INSERT_FAILURE_REFERENCE',
            failureMessage: `Foreign key constraint failure for entity ${
              failureForeignKey.resourceName
            }. Expected natural key was ${JSON.stringify(failureForeignKey.documentIdentity)}`,
          };
        }
        if (failureIndex - submittedForeignKeysLength < documentInfo.descriptorReferences.length) {
          // failure was with one of the descriptor condition check actions
          const failureDescriptorValue = documentInfo.descriptorReferences[failureIndex - submittedForeignKeysLength];
          return {
            result: 'INSERT_FAILURE_REFERENCE',
            failureMessage: `${JSON.stringify(
              failureDescriptorValue.documentIdentity,
            )} is not a valid value for descriptor ${failureDescriptorValue.resourceName}.`,
          };
        }
      }
    } else {
      Logger.error(`DynamoEntityRepository.createEntity`, traceId, '', error);
      return { result: 'UNKNOWN_FAILURE' };
    }
  }

  // Additional foreign key reference items that must be saved _after_ a
  // successful save of the main item.
  Logger.debug(
    `DynamoEntityRepository.createEntity Begin reference items for ${JSON.stringify(documentInfo.documentIdentity)}`,
    traceId,
  );

  const referenceItems = generateReferenceItems(putItem?.sk, documentInfo);
  Logger.debug('DynamoEntityRepository.createEntity reference items', traceId, null, referenceItems);
  const batches = R.splitEvery(25, referenceItems);

  Object.values(batches).forEach(async (batch) => {
    const params: TransactWriteCommandInput = {
      TransactItems: [...batch],
    };

    try {
      Logger.debug(
        `DynamoEntityRepository.createEntity Writing reference items for ${JSON.stringify(documentInfo.documentIdentity)}`,
        traceId,
      );
      await getDynamoDBDocumentClient().send(new TransactWriteCommand(params));
    } catch (error) {
      Logger.error(`DynamoEntityRepository.createEntity`, traceId, '', error);
      // TODO: decide if this should really be handled so silently, or if
      // something else should occur. Also consider checking for specific
      // situations - is there any unique behavior we want to take?
    }
  });

  return { result: 'INSERT_SUCCESS' };
}

/*
 * Deletes any items by partition key and sort key, in batches of 25.
 */
export async function deleteItems(items: { pk: string; sk: string }[], awsRequestId: string): Promise<DynamoDeleteResult> {
  Logger.debug('DynamoEntityRepository.deleteItems', awsRequestId);

  const transactItems = items.map((item) => ({
    Delete: {
      TableName: tableOpts.tableName,
      Key: {
        pk: item.pk,
        sk: item.sk,
      },
      ConditionExpression: 'attribute_exists(sk)',
    },
  }));

  const batches = R.splitEvery(25, transactItems);

  Object.values(batches).forEach(async (batch) => {
    const params: TransactWriteCommandInput = {
      TransactItems: [...batch],
    };

    try {
      Logger.debug(`DynamoEntityRepository.deleteItems deleting batch`, awsRequestId);
      await getDynamoDBDocumentClient().send(new TransactWriteCommand(params));
    } catch (error) {
      Logger.error(`DynamoEntityRepository.deleteItems`, awsRequestId, '', error);
      // TODO: decide if this should really be handled so silently, or if
      // something else should occur. Also consider checking for specific
      // situations - is there any unique behavior we want to take?
    }
  });

  return { success: true };
}

/**
 * Deletes the primary item from DynamoDB.
 */
export async function deleteEntityByIdDynamo(
  id: string,
  documentInfo: DocumentInfo,
  traceId: string,
): Promise<DynamoDeleteResult> {
  Logger.debug(`DynamoEntityRepository.deleteEntityByIdDynamo`, traceId);

  const deleteEntityItem: TransactWriteItem = {
    Delete: {
      TableName: tableOpts.tableName,
      Key: {
        pk: entityTypeStringFrom(documentInfo),
        sk: sortKeyFromId(id),
      },
      ConditionExpression: 'attribute_exists(sk)',
    },
  };

  const transactItems: TransactWriteItem[] = [deleteEntityItem];

  // if entity info is assignable, also delete the assignable item
  const assignableItem: TransactWriteItem | null = constructAssignableDeleteItem(id, documentInfo);
  if (assignableItem != null) transactItems.push(assignableItem);

  try {
    await getDynamoDBClient().send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (error) {
    if (error?.name === 'TransactionCanceledException') {
      // CancellationReasons provides imperfect information, but better than nothing
      const failureIndex = error.CancellationReasons.findIndex((reason) => reason.Code !== 'None');

      const entityItemIndex = 0;
      if (failureIndex === entityItemIndex) {
        // The specified id wasn't there, which is fine.
        return { success: true };
      }
    } else {
      Logger.error(`DynamoEntityRepository.deleteEntityByIdDynamo`, traceId, '', error);
      return { success: false };
    }
  }
  return { success: true };
}

async function getPage<TReturn>(
  statement: string,
  token: NextToken | null,
  mapper: (item: any) => TReturn,
): Promise<{ items: TReturn[]; nextToken: NextToken | undefined }> {
  const command = new ExecuteStatementCommand({ Statement: statement, NextToken: token || undefined });

  const output = await getDynamoDBClient().send(command);

  if (output.Items == null) return { items: [], nextToken: undefined };

  const items = Array.from(output.Items ?? []).map(mapper);
  return { items, nextToken: output.NextToken };
}

/*
 * Retrieves all the foreign key reference items ("TREF") for a given item (that is, the pointers to this item).
 */
export async function getReferencesToThisItem(
  id: string,
  documentInfo: DocumentInfo,
  traceId: string,
): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> {
  Logger.debug(
    `DynamoEntityRepository.getReferencesToThisItem for ${JSON.stringify(documentInfo.documentIdentity)}`,
    traceId,
  );

  const foreignKeys: ForeignKeyItem[] = [];

  const trefKey = ForeignKeyItem.buildToReferenceKey(sortKeyFromId(id));
  const statement = `select * from "${tableOpts.tableName}" where pk = '${trefKey}'`;
  Logger.debug(`DynamoEntityRepository.getReferencesToThisItem`, null, null, { statement });

  const mapper = (item: any) => {
    const i = unmarshall(item);
    return new ForeignKeyItem({
      From: i.sk,
      To: i.pk,
      Description: {
        NaturalKey: i.info?.NaturalKey,
        Type: i.info?.Type,
      },
    });
  };

  try {
    let nextToken: NextToken | null = null;
    do {
      const pageResponse = await getPage(statement, nextToken, mapper);
      nextToken = pageResponse.nextToken ?? null;
      foreignKeys.push(...pageResponse.items);
    } while (nextToken != null);

    return { success: true, foreignKeys };
  } catch (error) {
    Logger.error('DynamoEntityRepository.getReferencesToThisItem', traceId, null, error);

    return { success: false, foreignKeys };
  }
}

/*
 * Retrieves all the foreign key reference items ("FREF") from a given item (that is, the pointers away from the item).
 */
export async function getForeignKeyReferences(
  id: string,
  documentInfo: DocumentInfo,
  traceId: string,
): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> {
  Logger.debug(
    `DynamoEntityRepository.getForeignKeyReferences for ${JSON.stringify(documentInfo.documentIdentity)}`,
    traceId,
  );

  const foreignKeys: ForeignKeyItem[] = [];

  const frefKey = ForeignKeyItem.buildFromReferenceKey(sortKeyFromId(id));
  const statement = `select * from "${tableOpts.tableName}" where pk = '${frefKey}'`;
  Logger.debug(`DynamoEntityRepository.getForeignKeyReferences`, null, null, { statement });

  const mapper = (item: any) => {
    // Without the unmarshall, the object structure will include a letter for the data type
    const i = unmarshall(item);
    return new ForeignKeyItem({
      From: i.sk,
      To: i.pk,
    });
  };

  try {
    let nextToken: NextToken | null = null;
    do {
      const pageResponse = await getPage(statement, nextToken, mapper);
      nextToken = pageResponse.nextToken ?? null;
      foreignKeys.push(...pageResponse.items);
    } while (nextToken != null);

    return { success: true, foreignKeys };
  } catch (error) {
    Logger.error('DynamoEntityRepository.getForeignKeyReferences', traceId, null, error);

    return { success: false, foreignKeys };
  }
}

/**
 * Query entity item and return true if ownership is a match.
 */
export async function validateEntityOwnership(
  id: string,
  documentInfo: DocumentInfo,
  clientName: string | null,
  traceId: string,
): Promise<OwnershipResult> {
  Logger.debug(
    `DynamoEntityRepository.validateEntityOwnership for ${JSON.stringify(documentInfo.documentIdentity)}`,
    traceId,
  );

  const getParams: GetCommandInput = {
    TableName: tableOpts.tableName,
    Key: {
      pk: entityTypeStringFrom(documentInfo),
      sk: sortKeyFromId(id),
    },
  };

  let getResult: GetCommandOutput = NoOutput;

  try {
    getResult = await getDynamoDBDocumentClient().send(new GetCommand(getParams));
  } catch (error) {
    Logger.error(`DynamoEntityRepository.validateEntityOwnership ${error}`, traceId, '', error);
    return { result: 'ERROR', isOwner: false };
  }

  if (getResult.Item == null) {
    Logger.debug('DynamoEntityRepository.validateEntityOwnership item not found', traceId);
    return { result: 'NOT_FOUND', isOwner: false };
  }

  if (getResult.Item.ownerId == null) {
    Logger.debug('DynamoEntityRepository.validateEntityOwnership: No ownership of item', traceId);
    return { result: 'SUCCESS', isOwner: true };
  }

  if (clientName !== getResult.Item.ownerId) {
    Logger.debug(
      `DynamoEntityRepository.validateEntityOwnership: Ownership match failure - client ${clientName} access item owned by ${getResult.Item.ownerId}`,
      traceId,
    );
    return { result: 'SUCCESS', isOwner: false };
  }

  Logger.debug(`DynamoEntityRepository.validateEntityOwnership: Ownership match - client ${clientName}`, traceId);
  return { result: 'SUCCESS', isOwner: true };
}

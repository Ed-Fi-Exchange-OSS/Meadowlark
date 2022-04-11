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
import { EntityInfo, entityTypeStringFrom } from '../model/EntityInfo';
import { Security } from '../model/Security';
import {
  getDynamoDBDocumentClient,
  DeleteResult,
  entityIdPrefixRemoved,
  foreignKeyConditions,
  GetResult,
  PutResult,
  sortKeyFromId,
  tableOpts,
  descriptorValueConditions,
  generateReferenceItems,
  constructPutEntityItem,
  generatePutEntityThatFailsIfExists,
  constructAssignablePutItem,
  constructAssignableDeleteItem,
  getDynamoDBClient,
  OwnershipResult,
} from './BaseDynamoRepository';
import { NoOutput, TransactWriteItem } from '../types/AwsSdkLibDynamoDb';

import { Logger } from '../helpers/Logger';
import { ValidationOptions } from '../model/ValidationOptions';
import { ForeignKeyItem } from '../model/ForeignKeyItem';

type NextToken = string;

/**
 * Entry point for "get all" style query in DynamoDB. Querys by the entity type.
 */
export async function getEntityList(entityInfo: EntityInfo, lambdaRequestId: string): Promise<GetResult> {
  Logger.debug(`DynamoEntityRepository.getEntityList for ${entityInfo.entityName}`, lambdaRequestId);

  const queryParams: QueryCommandInput = {
    TableName: tableOpts.tableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': entityTypeStringFrom(entityInfo),
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
    Logger.error(`DynamoEntityRepository.getEntityList`, lambdaRequestId, '', error);
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
  lambdaRequestId: string,
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
    Logger.error(`DynamoEntityRepository.edOrgsForStudent`, lambdaRequestId, '', error);
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
  entityInfo: EntityInfo,
  id: string,
  security: Security,
  lambdaRequestId: string,
): Promise<GetResult> {
  Logger.debug(`DynamoEntityRepository.getEntityById for ${entityInfo.naturalKey}`, lambdaRequestId);

  const getParams: GetCommandInput = {
    TableName: tableOpts.tableName,
    Key: {
      pk: entityTypeStringFrom(entityInfo),
      sk: sortKeyFromId(id),
    },
  };

  let getResult: GetCommandOutput = NoOutput;

  try {
    getResult = await getDynamoDBDocumentClient().send(new GetCommand(getParams));
  } catch (error) {
    Logger.error(`DynamoEntityRepository.getEntityById ${error}`, lambdaRequestId, '', error);
    return { result: 'ERROR', documents: [] };
  }

  if (getResult.Item == null) return { result: 'NOT_FOUND', documents: [] };

  const documents = [{ id: entityIdPrefixRemoved(getResult.Item.sk), ...getResult.Item.info }];

  // Ownership-based security takes precedence
  if (security.isOwnershipEnabled) {
    if (getResult.Item.ownerId == null) {
      Logger.debug('DynamoEntityRepository.getEntityById: No ownership of item', lambdaRequestId);
      return { result: 'SUCCESS', documents, securityResolved: ['No ownership of item'] };
    }

    if (security.clientName !== getResult.Item.ownerId) {
      Logger.debug(
        `DynamoEntityRepository.getEntityById: Ownership match failure - client ${security.clientName} access item owned by ${getResult.Item.ownerId}`,
        lambdaRequestId,
      );
      return { result: 'AUTHORIZATION_FAILURE', documents: [], securityResolved: ['Ownership match failure'] };
    }

    Logger.debug(`DynamoEntityRepository.getEntityById: Ownership match - client ${security.clientName}`, lambdaRequestId);
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
      lambdaRequestId,
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
  entityInfo: EntityInfo,
  info: object,
  validationOptions: ValidationOptions,
  security: Security,
  lambdaRequestId: string,
): Promise<PutResult> {
  Logger.debug(`DynamoEntityRepository.updateEntityById for ${entityInfo.naturalKey}`, lambdaRequestId);
  const { referenceValidation, descriptorValidation } = validationOptions;

  const infoWithMetadata = referenceValidation ? info : { ...info, _unvalidated: true };

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
        pk: entityTypeStringFrom(entityInfo),
        sk: sortKeyFromId(id),
      },
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ConditionExpression,
      UpdateExpression: `set info = :info`,
    },
  };

  // Construct foreign key condition checks if reference validation is on
  const checkForeignKeys: TransactWriteItem[] = referenceValidation ? foreignKeyConditions(entityInfo) : [];
  // Construct descriptor value condition checks if descriptor validation is on
  const checkDescriptorValues: TransactWriteItem[] = descriptorValidation ? descriptorValueConditions(entityInfo) : [];

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
        const submittedForeignKeysLength = referenceValidation ? entityInfo.foreignKeys.length : 0;
        if (failureIndex < submittedForeignKeysLength) {
          // failure was with one of the foreign key condition check actions
          const failureForeignKey = entityInfo.foreignKeys[failureIndex];
          return {
            result: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `Foreign key constraint failure for entity ${failureForeignKey.metaEdName}. Expected natural key was ${failureForeignKey.constraintKey}`,
          };
        }
        if (failureIndex - submittedForeignKeysLength < entityInfo.descriptorValues.length) {
          // failure was with one of the descriptor condition check actions
          const failureDescriptorValue = entityInfo.descriptorValues[failureIndex - submittedForeignKeysLength];
          return {
            result: 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `${failureDescriptorValue.constraintKey} is not a valid value for descriptor ${failureDescriptorValue.metaEdName}.`,
          };
        }
      }
    } else {
      Logger.error(`DynamoEntityRepository.updateEntityById`, lambdaRequestId, error);
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
  entityInfo: EntityInfo,
  info: object,
  validationOptions: ValidationOptions,
  security: Security,
  lambdaRequestId: string,
): Promise<PutResult> {
  Logger.debug(`DynamoEntityRepository.createEntity for ${entityInfo.naturalKey}`, lambdaRequestId);
  const { referenceValidation, descriptorValidation } = validationOptions;

  const putItem = constructPutEntityItem(
    id,
    entityInfo,
    info,
    security.clientName,
    referenceValidation || descriptorValidation,
  );
  const tryPutEntity: TransactWriteItem = generatePutEntityThatFailsIfExists(putItem);

  // Construct foreign key condition checks if reference validation is on
  const checkForeignKeys: TransactWriteItem[] = referenceValidation ? foreignKeyConditions(entityInfo) : [];
  // Construct descriptor value condition checks if descriptor validation is on
  const checkDescriptorValues: TransactWriteItem[] = descriptorValidation ? descriptorValueConditions(entityInfo) : [];

  // Put all the actions together in order
  const transactItems: TransactWriteItem[] = [...checkForeignKeys, ...checkDescriptorValues, tryPutEntity];

  // if entity info is assignable, add an assignable item
  const assignableItem: TransactWriteItem | null = constructAssignablePutItem(entityInfo);
  if (assignableItem != null) transactItems.push(assignableItem);

  try {
    Logger.debug(`DynamoEntityRepository.createEntity Transacting key checks and item put request`, lambdaRequestId);
    await getDynamoDBDocumentClient().send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (error) {
    if (error?.name === 'TransactionCanceledException') {
      // CancellationReasons provides imperfect information, but better than nothing
      const failureIndex = error.CancellationReasons.findIndex((reason) => reason.Code !== 'None');

      const tryPutEntityIndex =
        assignableItem == null ? error.CancellationReasons.length - 1 : error.CancellationReasons.length - 2;
      if (failureIndex === tryPutEntityIndex) {
        // Entity already exists, try as update
        return updateEntityById(
          id,
          entityInfo,
          info,
          { referenceValidation, descriptorValidation },
          security,
          lambdaRequestId,
        );
      }

      const assignableItemIndex = assignableItem == null ? -1 : error.CancellationReasons.length - 1;
      if (failureIndex === assignableItemIndex) {
        // Another assignable subclass is using this natural key
        return {
          result: 'INSERT_FAILURE_ASSIGNABLE_COLLISION',
          failureMessage: `Another subclass of entity ${entityInfo.assignableInfo?.assignableToName} is already using the natural key ${entityInfo.assignableInfo?.assignableNaturalKey}`,
        };
      }

      const hasForeignKeyOrDescriptorChecks: boolean = checkForeignKeys.length > 0 || checkDescriptorValues.length > 0;
      if (hasForeignKeyOrDescriptorChecks) {
        const submittedForeignKeysLength = referenceValidation ? entityInfo.foreignKeys.length : 0;
        if (failureIndex < submittedForeignKeysLength) {
          // failure was with one of the foreign key condition check actions
          const failureForeignKey = entityInfo.foreignKeys[failureIndex];
          return {
            result: 'INSERT_FAILURE_REFERENCE',
            failureMessage: `Foreign key constraint failure for entity ${failureForeignKey.metaEdName}. Expected natural key was ${failureForeignKey.constraintKey}`,
          };
        }
        if (failureIndex - submittedForeignKeysLength < entityInfo.descriptorValues.length) {
          // failure was with one of the descriptor condition check actions
          const failureDescriptorValue = entityInfo.descriptorValues[failureIndex - submittedForeignKeysLength];
          return {
            result: 'INSERT_FAILURE_REFERENCE',
            failureMessage: `${failureDescriptorValue.constraintKey} is not a valid value for descriptor ${failureDescriptorValue.metaEdName}.`,
          };
        }
      }
    } else {
      Logger.error(`DynamoEntityRepository.createEntity`, lambdaRequestId, '', error);
      return { result: 'UNKNOWN_FAILURE' };
    }
  }

  // Additional foreign key reference items that must be saved _after_ a
  // successful save of the main item.
  Logger.debug(`DynamoEntityRepository.createEntity Begin reference items for ${entityInfo.naturalKey}`, lambdaRequestId);

  const referenceItems = generateReferenceItems(putItem?.sk, entityInfo);
  Logger.debug('DynamoEntityRepository.createEntity reference items', lambdaRequestId, null, referenceItems);
  const batches = R.splitEvery(25, referenceItems);

  Object.values(batches).forEach(async (batch) => {
    const params: TransactWriteCommandInput = {
      TransactItems: [...batch],
    };

    try {
      Logger.debug(
        `DynamoEntityRepository.createEntity Writing reference items for ${entityInfo.naturalKey}`,
        lambdaRequestId,
      );
      await getDynamoDBDocumentClient().send(new TransactWriteCommand(params));
    } catch (error) {
      Logger.error(`DynamoEntityRepository.createEntity`, lambdaRequestId, '', error);
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
export async function deleteItems(items: { pk: string; sk: string }[], awsRequestId: string): Promise<DeleteResult> {
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
export async function deleteEntityById(id: string, entityInfo: EntityInfo, lambdaRequestId: string): Promise<DeleteResult> {
  Logger.debug(`DynamoEntityRepository.deleteEntityById`, lambdaRequestId);

  const deleteEntityItem: TransactWriteItem = {
    Delete: {
      TableName: tableOpts.tableName,
      Key: {
        pk: entityTypeStringFrom(entityInfo),
        sk: sortKeyFromId(id),
      },
      ConditionExpression: 'attribute_exists(sk)',
    },
  };

  const transactItems: TransactWriteItem[] = [deleteEntityItem];

  // if entity info is assignable, also delete the assignable item
  const assignableItem: TransactWriteItem | null = constructAssignableDeleteItem(id, entityInfo);
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
      Logger.error(`DynamoEntityRepository.deleteEntityById`, lambdaRequestId, '', error);
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
  entityInfo: EntityInfo,
  lambdaRequestId: string,
): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> {
  Logger.debug(`DynamoEntityRepository.getReferencesToThisItem for ${entityInfo.naturalKey}`, lambdaRequestId);

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
    Logger.error('DynamoEntityRepository.getReferencesToThisItem', lambdaRequestId, null, error);

    return { success: false, foreignKeys };
  }
}

/*
 * Retrieves all the foreign key reference items ("FREF") from a given item (that is, the pointers away from the item).
 */
export async function getForeignKeyReferences(
  id: string,
  entityInfo: EntityInfo,
  lambdaRequestId: string,
): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> {
  Logger.debug(`DynamoEntityRepository.getForeignKeyReferences for ${entityInfo.naturalKey}`, lambdaRequestId);

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
    Logger.error('DynamoEntityRepository.getForeignKeyReferences', lambdaRequestId, null, error);

    return { success: false, foreignKeys };
  }
}

/**
 * Query entity item and return true if ownership is a match.
 */
export async function validateEntityOwnership(
  id: string,
  entityInfo: EntityInfo,
  clientName: string | null,
  lambdaRequestId: string,
): Promise<OwnershipResult> {
  Logger.debug(`DynamoEntityRepository.validateEntityOwnership for ${entityInfo.naturalKey}`, lambdaRequestId);

  const getParams: GetCommandInput = {
    TableName: tableOpts.tableName,
    Key: {
      pk: entityTypeStringFrom(entityInfo),
      sk: sortKeyFromId(id),
    },
  };

  let getResult: GetCommandOutput = NoOutput;

  try {
    getResult = await getDynamoDBDocumentClient().send(new GetCommand(getParams));
  } catch (error) {
    Logger.error(`DynamoEntityRepository.validateEntityOwnership ${error}`, lambdaRequestId, '', error);
    return { result: 'ERROR', isOwner: false };
  }

  if (getResult.Item == null) {
    Logger.debug('DynamoEntityRepository.validateEntityOwnership item not found', lambdaRequestId);
    return { result: 'NOT_FOUND', isOwner: false };
  }

  if (getResult.Item.ownerId == null) {
    Logger.debug('DynamoEntityRepository.validateEntityOwnership: No ownership of item', lambdaRequestId);
    return { result: 'SUCCESS', isOwner: true };
  }

  if (clientName !== getResult.Item.ownerId) {
    Logger.debug(
      `DynamoEntityRepository.validateEntityOwnership: Ownership match failure - client ${clientName} access item owned by ${getResult.Item.ownerId}`,
      lambdaRequestId,
    );
    return { result: 'SUCCESS', isOwner: false };
  }

  Logger.debug(`DynamoEntityRepository.validateEntityOwnership: Ownership match - client ${clientName}`, lambdaRequestId);
  return { result: 'SUCCESS', isOwner: true };
}

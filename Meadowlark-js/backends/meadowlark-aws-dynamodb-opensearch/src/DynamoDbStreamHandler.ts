// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-continue */
/* eslint-disable-next-line import/no-unresolved */
import { Context } from 'aws-lambda';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Client as EsClient } from '@opensearch-project/opensearch';
import { Logger } from '@edfi/meadowlark-core';
import { indexFromEntityTypeString, getOpenSearchClient } from './OpenSearchRepository';
import { entityIdPrefixRemoved } from './BaseDynamoRepository';

/** A locally-defined slice of a DynamoDBRecord's StreamRecord */
interface StreamRecord {
  Keys?: { [key: string]: AttributeValue } | undefined;
  NewImage?: { [key: string]: AttributeValue } | undefined;
}

/** A locally-defined slice of a DynamoDBStreamEvent's Record */
interface DynamoDBRecord {
  dynamodb?: StreamRecord | undefined;
  eventName?: 'INSERT' | 'MODIFY' | 'REMOVE' | undefined;
}

/** A locally-defined slice of a DynamoDBStreamEvent */
interface DynamoDBStreamEvent {
  Records: DynamoDBRecord[];
}

/**
 * Parameters for an OpenSearch request
 */
type RequestParamsType = { index: string; id: string };

/**
 * A slice of Entity item information from a DynamoDB Stream event
 */
type DynamoNewImage = {
  info: any;
  edOrgId?: string;
  studentId?: string;
  securityEdOrgId?: string;
  securityStudentId?: string;
  isDescriptor: boolean;
};

/**
 * A slice of key information from a DynamoDB Stream event
 */
type DynamoKeys = {
  sk?: string;
  pk: string;
};

/**
 * Given OpenSearch request parameters for a DynamoDB Entity item, remove the item
 * from OpenSearch if it exists.
 */
async function removeFromOpenSearchIfExists(client: EsClient, requestParams: RequestParamsType, awsRequestId: string) {
  try {
    Logger.debug(`Checking if ${requestParams.index} exists in OpenSearch`, awsRequestId);
    if ((await client.exists({ ...requestParams, refresh: true })).body) {
      Logger.debug(`DynamoDbStreamHandler.removeFromOpenSearchIfExists removing ${requestParams.index}`, awsRequestId);
      await client.delete({ ...requestParams, refresh: true });
    }
  } catch (err) {
    Logger.error(`DynamoDbStreamHandler.removeFromOpenSearchIfExists`, awsRequestId, err);
  }
}

/**
 * Given a DynamoDB Entity item and OpenSearch request parameters, upsert the
 * Entity item into OpenSearch.
 */
async function insertIntoOpenSearch(
  client: EsClient,
  newImage: DynamoNewImage,
  requestParams: RequestParamsType,
  awsRequestId: string,
) {
  Logger.debug(`DynamoDbStreamHandler.insertIntoOpenSearch Insert ${requestParams.index} into OpenSearch`, awsRequestId);
  try {
    await client.index({
      ...requestParams,
      body: {
        id: requestParams.id,
        info: JSON.stringify({ id: requestParams.id, ...newImage.info }),
        ...newImage.info,
        extractedEdOrgId: newImage.edOrgId,
        extractedStudentId: newImage.studentId,
        securityEdOrgId: newImage.securityEdOrgId,
        securityStudentId: newImage.securityStudentId,
      },
      refresh: true,
    });
  } catch (err) {
    Logger.error(`DynamoDbStreamHandler.insertIntoOpenSearch`, awsRequestId, err);
  }
}

/**
 * Given the partition and sort keys from the DynamoDb Stream event,
 * build the OpenSearch request parameters.
 */
function buildOpenSearchRequestParameters(keys: DynamoKeys): RequestParamsType {
  const id = entityIdPrefixRemoved(keys.sk as string);
  const requestParams = {
    index: indexFromEntityTypeString(keys.pk),
    id,
  };

  return requestParams;
}

/**
 * Entry point for DynamoDB Stream events
 *
 * Looks for change events for Entity items. Triggers removal from OpenSearch for
 * deleted Entity items, and upsert into OpenSearch for new or modified
 * Entity items.
 */
export async function updateExternalStorage(event: DynamoDBStreamEvent, context: Context) {
  Logger.info('DynamoDbStreamHandler.updateExternalStorage', context.awsRequestId);
  const client = await getOpenSearchClient(context.awsRequestId);

  // eslint-disable-next-line no-restricted-syntax
  for (const record of event.Records) {
    if (record.dynamodb?.Keys == null) {
      Logger.debug(
        `DynamoDbStreamHandler.updateExternalStorage Skipping ${JSON.stringify(
          record,
        )} since it doesn't have the 'dynamodb.Keys' key`,
        context.awsRequestId,
      );
      continue;
    }
    const keys = unmarshall(record.dynamodb.Keys) as DynamoKeys;

    // Ignore if not an entity item.
    if (!keys.pk.startsWith('TYPE#')) {
      Logger.debug(
        `DynamoDbStreamHandler.updateExternalStorage Skipping ${JSON.stringify(
          record,
        )} since it is not recognized as an entity`,
        context.awsRequestId,
      );
      continue;
    }

    // Ignore if an assignable item
    if (keys.sk?.startsWith('ASSIGN#')) {
      Logger.debug(
        `DynamoDbStreamHandler.updateExternalStorage Skipping ${JSON.stringify(record)} since it is an assignable item`,
        context.awsRequestId,
      );
      continue;
    }

    const requestParams = buildOpenSearchRequestParameters(keys);

    switch (record.eventName) {
      case 'REMOVE': {
        await removeFromOpenSearchIfExists(client, requestParams, context.awsRequestId);

        break;
      }
      case 'MODIFY': {
        // TODO: update OpenSearch RND-181

        Logger.debug(
          `DynamoDbStreamHandler.updateExternalStorage ${record.eventName} was detected but no specific action is taken for now`,
          context.awsRequestId,
        );
        break;
      }
      case 'INSERT': {
        if (record.dynamodb?.NewImage == null) continue;
        Logger.debug(`DynamoDbStreamHandler.updateExternalStorage prepare insert to OpenSearch`, context.awsRequestId);
        const newImage = unmarshall(record.dynamodb.NewImage) as DynamoNewImage;

        // Ignore if a descriptor.
        // eslint-disable-next-line no-underscore-dangle
        if (newImage.isDescriptor) {
          Logger.debug(
            `DynamoDbStreamHandler.updateExternalStorage Skipping ${JSON.stringify(record)} since it is a descriptor entity`,
            context.awsRequestId,
          );
          continue;
        }

        await insertIntoOpenSearch(client, newImage, requestParams, context.awsRequestId);

        break;
      }
      default:
        Logger.info(
          `DynamoDbStreamHandler.updateExternalStorage ${record.eventName} wasn't recognized.  Ignoring.`,
          context.awsRequestId,
        );
    }
  }
}

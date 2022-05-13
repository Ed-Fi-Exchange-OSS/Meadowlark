// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { ClientRequestArgs, request } from 'http';
import { Client, Connection } from '@elastic/elasticsearch';
import { ConnectionOptions } from '@elastic/elasticsearch/lib/Connection';
import { defaultProvider as AWSCredentialProvider } from '@aws-sdk/credential-provider-node';
import type { Credentials } from '@aws-sdk/types';
import { sign } from 'aws4';
import { DocumentInfo, Logger, QueryRequest, QueryResult } from '@edfi/meadowlark-core';
import { entityTypeStringFrom } from './Utility';

/**
 * A replacement for @acuris/aws-es-connection's "createAWSConnection", using aws4.
 * Allows us to use @aws-sdk/credential-provider-node instead of aws-sdk v2 dependency.
 */
function createESConnection(credentials: Credentials) {
  return class extends Connection {
    public constructor(opts: ConnectionOptions) {
      super(opts);
      this.makeRequest = (reqParams: ClientRequestArgs) => request(sign({ ...reqParams, service: 'es' }, credentials));
    }
  };
}

/**
 * Returns Elasticsearch index name for a given entity type, as defined by a
 * DynamoDB partition key
 *
 * Elasticsearch indexes are required to be lowercase only, with no pound signs,
 * whereas pound signs separators are commonly used in DynamoDB
 */
export function indexFromEntityTypeString(pk: string): string {
  return pk.toLowerCase().replace(/#/g, '$').replace(/\./g, '-');
}

/**
 * Returns Elasticsearch index name for an entity type, from the given DocumentInfo.
 *
 * Elasticsearch indexes are required to be lowercase only, with no pound signs,
 * wheras pound signs separators are commonly used in DynamoDB
 */
export function indexFromEntityInfo(documentInfo: DocumentInfo): string {
  return indexFromEntityTypeString(entityTypeStringFrom(documentInfo));
}

// TODO: RND-203 unsafe for SQL injection
/**
 * Convert query string parameters from http request to Elasticsearch
 * SQL WHERE conditions.
 */
function whereConditionsFrom(queryStringParameters: object): string {
  return Object.entries(queryStringParameters)
    .map(([field, value]) => `${field} = '${value}'`)
    .join(' AND ');
}

/**
 * Create and return an Elasticsearch connection object
 */
export async function getElasticsearchClient(awsRequestId: string): Promise<Client> {
  if (process.env.STAGE === 'local') {
    Logger.debug('ElasticsearchRepository.getElasticsearchClient creating Elasticsearch local client', awsRequestId);
    return new Client({
      node: process.env.ES_LOCAL_ENDPOINT,
      auth: { username: process.env.ES_USERNAME ?? 'x', password: process.env.ES_PASSWORD ?? 'y' },
    });
  }

  Logger.debug('ElasticsearchRepository.getElasticsearchClient creating Elasticsearch client', awsRequestId);

  return new Client({
    Connection: createESConnection(await AWSCredentialProvider()()),
    node: `https://${process.env.ES_ENDPOINT}`,
  });
}

/**
 * This mechanism of SQL querying is specific to Amazon's open source version of Elasticsearch,
 * as SQL queries are only otherwise available in the Elasticsearch paid edition.
 */
async function performSqlQuery(client: Client, query: string): Promise<any> {
  return client.transport.request({
    method: 'POST',
    path: '/_opendistro/_sql',
    body: { query },
  });
}

/**
 * Entry point for querying with Elasticsearch, given entity info, the original http
 * request query parameters, and a Security object for possible filtering
 */
export async function queryEntityList({
  documentInfo,
  queryStringParameters,
  paginationParameters,
  traceId,
}: QueryRequest): Promise<QueryResult> {
  const client = await getElasticsearchClient(traceId);

  Logger.debug(`Building query`, traceId);

  let documents: any = [];
  try {
    let query = `SELECT info FROM ${indexFromEntityInfo(documentInfo)}`;
    if (Object.entries(queryStringParameters).length > 0) {
      query += ` WHERE ${whereConditionsFrom(queryStringParameters)} ORDER BY _doc`;
    }
    if (paginationParameters.limit != null) query += ` LIMIT ${paginationParameters.limit}`;
    if (paginationParameters.offset != null) query += ` OFFSET ${paginationParameters.offset}`;

    Logger.debug(`ElasticsearchRepository.queryEntityList executing query: ${query}`, traceId);

    const { body } = await performSqlQuery(client, query);

    Logger.debug(`Result: ${JSON.stringify(body)}`, traceId);
    documents = body.datarows.map((datarow) => JSON.parse(datarow));
  } catch (e) {
    const body = JSON.parse(e.meta.body);

    switch (body?.error?.type) {
      case 'IndexNotFoundException':
        // No object has been uploaded for the requested type
        return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [] };
      case 'SemanticAnalysisException':
        // The query term is invalid
        Logger.debug('ElasticsearchRepository.queryEntityList', traceId, 'n/a', e.meta.body);
        return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [{ error: body.error.details }] };
      default:
        Logger.error('ElasticsearchRepository.queryEntityList', traceId, 'n/a', body ?? e);
        return { response: 'UNKNOWN_FAILURE', documents: [] };
    }
  }

  return { response: 'QUERY_SUCCESS', documents };
}

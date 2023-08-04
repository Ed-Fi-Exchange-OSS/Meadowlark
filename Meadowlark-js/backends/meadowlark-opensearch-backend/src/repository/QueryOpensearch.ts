// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Client } from '@opensearch-project/opensearch';
import { QueryRequest, QueryResult, ResourceInfo } from '@edfi/meadowlark-core';
import { isDebugEnabled, Logger } from '@edfi/meadowlark-utilities';
import { handleOpenSearchError } from './OpenSearchException';

const moduleName = 'opensearch.repository.QueryOpensearch';

/**
 * Returns OpenSearch index name from the given ResourceInfo.
 *
 * OpenSearch indexes are required to be lowercase only, with no pound signs or periods.
 */
export function indexFromResourceInfo(resourceInfo: ResourceInfo): string {
  return `${resourceInfo.projectName}$${resourceInfo.resourceVersion}$${resourceInfo.resourceName}`
    .toLowerCase()
    .replace(/\./g, '-');
}

/**
 * Sanitizes input by escaping single all apostrophes. If \' is present, then someone is trying to evade the sanitization. In
 * that case, replace the search term with an empty string.
 */
function sanitize(input: string): string {
  if (input.indexOf(`\\'`) > -1) {
    return '';
  }

  return input.replaceAll(`'`, `\\'`);
}

/**
 * Convert query string parameters from http request to OpenSearch
 * SQL WHERE conditions. Returns empty string if there are none.
 */
function whereConditionsFrom(queryParameters: object): string {
  return Object.entries(queryParameters)
    .map(([field, value]) => `${field} = '${sanitize(value)}'`)
    .join(' AND ');
}

/**
 * This mechanism of SQL querying is specific to OpenSearch (vs Elasticsearch)
 */
async function performSqlQuery(client: Client, query: string): Promise<any> {
  return client.transport.request({
    method: 'POST',
    path: '/_opendistro/_sql',
    body: { query },
  });
}

/**
 * Returns well-formed WHERE clause from existing where clause and new clause
 */
function appendedWhereClause(existingWhereClause: string, newWhereClause: string): string {
  if (existingWhereClause === '') return newWhereClause;
  return `${existingWhereClause} AND ${newWhereClause}`;
}

/**
 * Entry point for querying with OpenSearch
 */
export async function queryDocuments(request: QueryRequest, client: Client): Promise<QueryResult> {
  const { resourceInfo, queryParameters, paginationParameters, traceId } = request;

  Logger.debug(`${moduleName}.queryDocuments Building query`, traceId);

  let documents: any = [];
  let recordCount: number;
  try {
    let query = `SELECT info FROM ${indexFromResourceInfo(resourceInfo)}`;
    let whereClause: string = '';

    // API client requested filters
    if (Object.entries(queryParameters).length > 0) {
      whereClause = whereConditionsFrom(queryParameters);
    }

    // Ownership-based security filter - if the resource is a descriptor we will ignore security
    if (request.security.authorizationStrategy.type === 'OWNERSHIP_BASED' && !resourceInfo.isDescriptor) {
      const securityWhereClause = `createdBy = '${request.security.clientId}'`;
      whereClause = appendedWhereClause(whereClause, securityWhereClause);
    }

    if (whereClause !== '') {
      query += ` WHERE ${whereClause}`;
    }

    query += ' ORDER BY _doc';

    if (paginationParameters.limit != null) query += ` LIMIT ${paginationParameters.limit}`;
    if (paginationParameters.offset != null) query += ` OFFSET ${paginationParameters.offset}`;

    Logger.debug(`${moduleName}.queryDocuments queryDocuments executing query: ${query}`, traceId);

    const { body } = await performSqlQuery(client, query);
    recordCount = body.total;

    documents = body.datarows.map((datarow) => JSON.parse(datarow));

    if (isDebugEnabled()) {
      const idsForLogging: string[] = documents.map((document) => document.id);
      Logger.debug(`${moduleName}.queryDocuments Ids of documents returned: ${JSON.stringify(idsForLogging)}`, traceId);
    }
  } catch (e) {
    return handleOpenSearchError(e, `${moduleName}.queryDocuments`, traceId);
  }

  return { response: 'QUERY_SUCCESS', documents, totalCount: recordCount };
}

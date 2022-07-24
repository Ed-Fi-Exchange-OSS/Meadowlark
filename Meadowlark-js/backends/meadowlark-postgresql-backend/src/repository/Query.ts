// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { PoolClient, QueryResult as PostgresResult } from 'pg';
import { QueryRequest, QueryResult, Logger, ResourceInfo } from '@edfi/meadowlark-core';

// TODO: Unsafe for SQL injection
function edfiDocWhereConditionsFrom(queryStringParameters: object): string {
  // TODO: Convert dot notation in query to subobjects before stringifying
  //       Consider "set-value" or "dot-prop" libraries for this
  return JSON.stringify(queryStringParameters);
}

/**
 * TODO: Unsafe for SQL injection
 * TODO: These 3 columns need to be indexed...or a new concatenated column indexed
 *
 */
function resourceInfoWhereConditionsFrom(resourceInfo: ResourceInfo): string {
  return `d.project_name='${resourceInfo.projectName}' AND d.resource_name='${resourceInfo.resourceName}' AND d.resource_version='${resourceInfo.resourceVersion}'`;
}

/**
 * Indexing optimization will be interesting. GIN indexes are necessary on JSONB columns for search. GIN indexes
 * do not provide sorting, yet we need pagination support. We also need to filter by resource-name/project-name/version,
 * not just the JSON.
 *
 * Problem #1: We need to query both on resource-name/project-name/version and the query parameters. Query parameters
 * can be handled by the GIN index on edfi_doc column, resource-name/project-name/version would be handled by the
 * standard btree indexes on resource-name/project-name/version columns. However, we want this to be a single index,
 * but you can't GIN on a string column like resource_name or BTREE on a JSONB column like edfi_doc.
 *
 * Solution #1: Use the trusted btree_gin PostgreSQL extension, which extends GIN to simple column types, and create
 * a multi-column index on resource_name, project_name, resource_version and edfi_doc. Consider collapsing down the
 * resource-name/project-name/version tuple to a single concatenated column -- though this is an optimization only
 * relevant to "standalone PostgreSQL".
 *
 * See: https://pganalyze.com/blog/gin-index
 *
 * Problem #2: We need to provide pagination support. GIN indexes (including btree_gin's implementation) do not
 * support sorting.
 *
 * Solution #2: If Meadowlark provides "next cursor"-style support instead of limit/offset, we can implement pagination on a
 * sortable column like documentid. This might take the form of a subquery that uses the GIN index first (ensuring the
 * GIN index gets used, as the query optimizer often gets the best option wrong here), then the main query sorts and limits
 * on documentIds, optionally starting with the next cursor token.
 *
 * See: https://ivopereira.net/efficient-pagination-dont-use-offset-limit,
 *      https://slack.engineering/evolving-api-pagination-at-slack-1c1f644f8e12,
 *      https://dba.stackexchange.com/questions/113132/gin-index-not-used-when-adding-order-clause
 *      https://dba.stackexchange.com/questions/208065/why-is-limit-killing-performance-of-this-postgres-query
 */
export async function queryDocuments(request: QueryRequest, client: PoolClient): Promise<QueryResult> {
  // TODO: ignores pagination parameters
  const { resourceInfo, queryStringParameters, traceId } = request;

  Logger.debug(`Building query`, traceId);

  let documents: any = [];
  try {
    const query = `SELECT * FROM meadowlark.meadowlark.documents d WHERE d.edfi_doc @> '${edfiDocWhereConditionsFrom(
      queryStringParameters,
    )}' AND ${resourceInfoWhereConditionsFrom(resourceInfo)}`;

    Logger.debug(`meadowlark-opensearch-backend: queryDocuments executing query: ${query}`, traceId);

    const queryResult: PostgresResult = await client.query(query);

    documents = queryResult.rows.map((row) => row.edfi_doc);
  } catch (e) {
    // TODO: Handle invalid query parameters without 500-ing
    Logger.error('meadowlark-postgresql: queryDocuments', traceId, e);
    return { response: 'UNKNOWN_FAILURE', documents: [] };
  }

  return { response: 'QUERY_SUCCESS', documents };
}

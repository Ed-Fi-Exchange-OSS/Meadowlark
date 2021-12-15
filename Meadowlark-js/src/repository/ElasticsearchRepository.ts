// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import R from 'ramda';
import { ClientRequestArgs, request } from 'http';
import { Client, Connection } from '@elastic/elasticsearch';
import { ConnectionOptions } from '@elastic/elasticsearch/lib/Connection';
import { defaultProvider as AWSCredentialProvider } from '@aws-sdk/credential-provider-node';
import type { Credentials } from '@aws-sdk/types';
import { sign } from 'aws4';
import { EntityInfo, entityTypeStringFrom } from '../model/EntityInfo';
import { Security } from '../model/Security';
import { Logger } from '../helpers/Logger';

export type GetResult = {
  success: boolean;
  results: Array<object>;
};

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
 * Returns Elasticsearch index name for an entity type, from the given EntityInfo.
 *
 * Elasticsearch indexes are required to be lowercase only, with no pound signs,
 * wheras pound signs separators are commonly used in DynamoDB
 */
export function indexFromEntityInfo(entityInfo: EntityInfo): string {
  return indexFromEntityTypeString(entityTypeStringFrom(entityInfo));
}

// TODO: unsafe for SQL injection
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
 * For Education Organization and Student security, combine WHERE clauses
 * if necessary. Assumes at least one is not empty.
 */
function fullDirectWare(edOrgDirectWhere: string, studentDirectWhere: string): string {
  if (edOrgDirectWhere === '') return studentDirectWhere;
  if (studentDirectWhere === '') return edOrgDirectWhere;
  return `(${edOrgDirectWhere} OR ${studentDirectWhere})`;
}

/**
 * Entry point for querying with Elasticsearch, given entity info, the original http
 * request query parameters, and a Security object for possible filtering
 */
export async function queryEntityList(
  entityInfo: EntityInfo,
  queryStringParameters: object,
  security: Security,
  awsRequestId: string,
): Promise<GetResult> {
  Logger.debug(`ElasticsearchRepository.queryEntityList security info: ${JSON.stringify(security)}`, awsRequestId);

  const client = await getElasticsearchClient(awsRequestId);

  let directResults: any = {};
  const whereConditionsFromQueryString = whereConditionsFrom(queryStringParameters);
  Logger.debug(`Building query`, awsRequestId);
  try {
    // direct relationship
    let query = `SELECT info FROM ${indexFromEntityInfo(entityInfo)} WHERE `;

    // no security if no claims (for demo/testing reasons)
    if (security.edOrgIds.length === 0 && security.studentIds.length === 0) {
      query += whereConditionsFromQueryString;
    } else {
      let edOrgDirectWhere = '';
      let studentDirectWhere = '';

      // ed org direct security
      if (security.edOrgIds.length > 0) {
        edOrgDirectWhere = `extractedEdOrgId IN (${security.edOrgIds.map((edOrgId) => `'${edOrgId}'`).join(', ')})`;
      }
      // student direct security
      if (security.studentIds.length > 0) {
        studentDirectWhere += `extractedStudentId IN (${security.studentIds.map((edOrgId) => `'${edOrgId}'`).join(', ')})`;
      }

      const directWhere = fullDirectWare(edOrgDirectWhere, studentDirectWhere);
      query += `${whereConditionsFromQueryString} AND ${directWhere}`;
    }

    Logger.debug(`ElasticsearchRepository.queryEntityList executing query: ${query}`, awsRequestId);

    const { body } = await performSqlQuery(client, query);

    Logger.debug(`Result: ${JSON.stringify(body)}`, awsRequestId);
    directResults = body.datarows.map((datarow) => JSON.parse(datarow));
  } catch (e) {
    const body = JSON.parse(e.meta.body);

    switch (body?.error?.type) {
      case 'IndexNotFoundException':
        // No object has been uploaded for the requested type
        return { success: true, results: [] };
      case 'SemanticAnalysisException':
        // The query term is invalid, respond with a validation message
        Logger.debug('ElasticsearchRepository.queryEntityList', awsRequestId, 'n/a', e.meta.body);
        return { success: false, results: [{ error: body.error.details }] };
      default:
        Logger.error('ElasticsearchRepository.queryEntityList', awsRequestId, 'n/a', body ?? e);
        return { success: false, results: [] };
    }
  }

  if (security.edOrgIds.length > 0 && security.throughAssociation != null) {
    Logger.debug(`Filtering by EdOrg`, awsRequestId);
    let throughResults: any = {};
    try {
      // through relationship - student indirect security

      // TODO: currently assumes Ed-Fi 3.3b for simplicity of header directives
      const query = `SELECT entity.info FROM ${indexFromEntityInfo(
        entityInfo,
      )} entity JOIN ed-fi$3-3-1-b$${security.throughAssociation?.toLowerCase()} through ON entity.extractedStudentId = through.extractedStudentId WHERE through.extractedEdOrgId IN (${security.edOrgIds
        .map((edOrgId) => `'${edOrgId}'`)
        .join(', ')}) AND ${whereConditionsFromQueryString}`;

      Logger.debug(`ElasticsearchRepository.queryEntityList executing query: ${query}`, awsRequestId);

      const { body } = await (client as any).awsSql({ query });
      throughResults = body.datarows.map((datarow) => JSON.parse(datarow));
      Logger.debug(`ElasticsearchRepository.queryEntityList result: ${JSON.stringify(body)}`, awsRequestId);
    } catch (e) {
      Logger.error(`ElasticsearchRepository.queryEntityList filtering by edorg`, awsRequestId, 'n/a', e);
      return { success: false, results: [] };
    }

    return { success: true, results: R.uniqBy((result) => result.id, [...directResults, ...throughResults]) };
  }

  return { success: true, results: directResults };
}

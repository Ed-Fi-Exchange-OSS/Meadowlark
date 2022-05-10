// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo, GetResult, PaginationParameters, SearchResult } from '@edfi/meadowlark-core';
import { MongoClient } from 'mongodb';

export async function queryDocumentList(
  _documentInfo: DocumentInfo,
  _queryStringParameters: object,
  _paginationParameters: PaginationParameters,
  _awsRequestId: string,
  _client: MongoClient,
): Promise<SearchResult> {
  return { success: false, results: [] };
}

export async function getDocumentList(
  _documentInfo: DocumentInfo,
  _traceId: string,
  _client: MongoClient,
): Promise<GetResult> {
  return { result: 'ERROR', documents: [] };
}

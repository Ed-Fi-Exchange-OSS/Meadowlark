// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo } from '../../model/DocumentInfo';
import { Security } from '../../model/Security';
import { GetResult } from './GetResult';
import { DeleteResult } from './DeleteResult';
import { PaginationParameters } from './PaginationParameters';
import { SearchResult } from './SearchResult';
import { UpdateResult } from './UpdateResult';
import { UpsertResult } from './UpsertResult';

export interface MeadowlarkBackendPlugin {
  upsertDocument: (
    id: string,
    documentInfo: DocumentInfo,
    info: object,
    validate: boolean,
    security: Security,
    traceId: string,
  ) => Promise<UpsertResult>;

  getDocumentById: (documentInfo: DocumentInfo, id: string, security: Security, traceId: string) => Promise<GetResult>;

  getDocumentList: (documentInfo: DocumentInfo, traceId: string) => Promise<GetResult>;

  updateDocumentById: (
    id: string,
    documentInfo: DocumentInfo,
    info: object,
    validate: boolean,
    security: Security,
    traceId: string,
  ) => Promise<UpdateResult>;

  deleteDocumentById: (
    id: string,
    documentInfo: DocumentInfo,
    validate: boolean,
    security: Security,
    traceId: string,
  ) => Promise<DeleteResult>;

  queryDocumentList: (
    documentInfo: DocumentInfo,
    queryStringParameters: object,
    paginationParameters: PaginationParameters,
    awsRequestId: string,
  ) => Promise<SearchResult>;
}

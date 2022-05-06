// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo } from '../../model/DocumentInfo';
import { Security } from '../../model/Security';
import { ValidationOptions } from '../../model/ValidationOptions';
import { GetResult } from './GetResult';
import { PutResult } from './PutResult';
import { DeleteResult } from './DeleteResult';
import { PaginationParameters } from './PaginationParameters';
import { SearchResult } from './SearchResult';

export interface MeadowlarkBackendPlugin {
  upsertDocument: (
    id: string,
    documentInfo: DocumentInfo,
    info: object,
    validationOptions: ValidationOptions,
    security: Security,
    traceId: string,
  ) => Promise<PutResult>;

  getDocumentById: (_documentInfo: DocumentInfo, id: string, _security: Security, _traceId: string) => Promise<GetResult>;

  getDocumentList: (_documentInfo: DocumentInfo, _traceId: string) => Promise<GetResult>;

  updateDocumentById: (
    _id: string,
    _documentInfo: DocumentInfo,
    _info: object,
    _validationOptions: ValidationOptions,
    _security: Security,
    _traceId: string,
  ) => Promise<PutResult>;

  deleteDocumentById: (
    _id: string,
    _documentInfo: DocumentInfo,
    _validationOptions: ValidationOptions,
    _security: Security,
    _traceId: string,
  ) => Promise<DeleteResult>;

  queryDocumentList: (
    documentInfo: DocumentInfo,
    queryStringParameters: object,
    paginationParameters: PaginationParameters,
    awsRequestId: string,
  ) => Promise<SearchResult>;
}

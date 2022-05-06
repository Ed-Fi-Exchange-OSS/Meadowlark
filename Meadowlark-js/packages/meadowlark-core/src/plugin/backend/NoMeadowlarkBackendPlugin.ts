// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo } from '../../model/DocumentInfo';
import { Security } from '../../model/Security';
import { DeleteResult } from './DeleteResult';
import { PaginationParameters } from './PaginationParameters';
import { SearchResult } from './SearchResult';
import { Logger } from '../../helpers/Logger';
import { MeadowlarkBackendPlugin } from './MeadowlarkBackendPlugin';
import { UpsertResult } from './UpsertResult';
import { UpdateResult } from './UpdateResult';
import { GetResult } from './GetResult';

export const NoMeadowlarkBackendPlugin: MeadowlarkBackendPlugin = {
  upsertDocument: (
    _id: string,
    _documentInfo: DocumentInfo,
    _info: object,
    _validate: boolean,
    _security: Security,
    traceId: string,
  ): Promise<UpsertResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.upsertDocument(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  getDocumentById: (_documentInfo: DocumentInfo, _id: string, _security: Security, traceId: string): Promise<GetResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.getDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'ERROR', documents: [] });
  },

  getDocumentList: (_documentInfo: DocumentInfo, traceId: string): Promise<GetResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.getDocumentList(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'ERROR', documents: [] });
  },

  updateDocumentById: (
    _id: string,
    _documentInfo: DocumentInfo,
    _info: object,
    _validate: boolean,
    _security: Security,
    traceId: string,
  ): Promise<UpdateResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.updateDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  deleteDocumentById: (
    _id: string,
    _documentInfo: DocumentInfo,
    _validate: boolean,
    _security: Security,
    traceId: string,
  ): Promise<DeleteResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.deleteDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  queryDocumentList: (
    _documentInfo: DocumentInfo,
    _queryStringParameters: object,
    _paginationParameters: PaginationParameters,
    traceId: string,
  ): Promise<SearchResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.queryDocumentList(): No backend plugin has been configured', traceId);
    return Promise.resolve({ success: false, results: [] });
  },
};

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
import { Logger } from '../../helpers/Logger';
import { MeadowlarkBackendPlugin } from './MeadowlarkBackendPlugin';

export const NoMeadowlarkBackendPlugin: MeadowlarkBackendPlugin = {
  createEntity: (
    _id: string,
    _documentInfo: DocumentInfo,
    _info: object,
    _validationOptions: ValidationOptions,
    _security: Security,
    lambdaRequestId: string,
  ): Promise<PutResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.createEntity(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  getEntityById: (
    _documentInfo: DocumentInfo,
    _id: string,
    _security: Security,
    lambdaRequestId: string,
  ): Promise<GetResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.getEntityById(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'ERROR', documents: [] });
  },

  getEntityList: (_documentInfo: DocumentInfo, lambdaRequestId: string): Promise<GetResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.getEntityList(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'ERROR', documents: [] });
  },

  updateEntityById: (
    _id: string,
    _documentInfo: DocumentInfo,
    _info: object,
    _validationOptions: ValidationOptions,
    _security: Security,
    lambdaRequestId: string,
  ): Promise<PutResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.updateEntityById(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  deleteEntityById: (
    _id: string,
    _documentInfo: DocumentInfo,
    _validationOptions: ValidationOptions,
    _security: Security,
    lambdaRequestId: string,
  ): Promise<DeleteResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.deleteEntityById(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  queryEntityList: (
    _documentInfo: DocumentInfo,
    _queryStringParameters: object,
    _paginationParameters: PaginationParameters,
    lambdaRequestId: string,
  ): Promise<SearchResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.queryEntityList(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ success: false, results: [] });
  },
};

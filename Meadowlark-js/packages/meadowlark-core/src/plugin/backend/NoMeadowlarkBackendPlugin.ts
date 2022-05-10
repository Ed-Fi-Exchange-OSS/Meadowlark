// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DeleteResult } from './DeleteResult';
import { QueryResult } from './QueryResult';
import { Logger } from '../../helpers/Logger';
import { MeadowlarkBackendPlugin } from './MeadowlarkBackendPlugin';
import { UpsertResult } from './UpsertResult';
import { UpdateResult } from './UpdateResult';
import { GetResult } from './GetResult';
import { QueryRequest } from './QueryRequest';
import { DeleteRequest } from './DeleteRequest';
import { UpdateRequest } from './UpdateRequest';
import { GetRequest } from './GetRequest';
import { UpsertRequest } from './UpsertRequest';

export const NoMeadowlarkBackendPlugin: MeadowlarkBackendPlugin = {
  upsertDocument: ({ traceId }: UpsertRequest): Promise<UpsertResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.upsertDocument(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  getDocumentById: ({ traceId }: GetRequest): Promise<GetResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.getDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'ERROR', documents: [] });
  },

  getDocumentList: ({ traceId }: QueryRequest): Promise<GetResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.getDocumentList(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'ERROR', documents: [] });
  },

  updateDocumentById: ({ traceId }: UpdateRequest): Promise<UpdateResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.updateDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  deleteDocumentById: ({ traceId }: DeleteRequest): Promise<DeleteResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.deleteDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  queryDocumentList: ({ traceId }: QueryRequest): Promise<QueryResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.queryDocumentList(): No backend plugin has been configured', traceId);
    return Promise.resolve({ success: false, results: [] });
  },
};

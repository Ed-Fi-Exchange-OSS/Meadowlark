// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GetRequest } from '../../message/GetRequest';
import { GetResult } from '../../message/GetResult';
import { DeleteRequest } from '../../message/DeleteRequest';
import { DeleteResult } from '../../message/DeleteResult';
import { UpdateRequest } from '../../message/UpdateRequest';
import { UpdateResult } from '../../message/UpdateResult';
import { UpsertRequest } from '../../message/UpsertRequest';
import { UpsertResult } from '../../message/UpsertResult';
import { Logger } from '../../Logger';
import { DocumentStorePlugin } from './DocumentStorePlugin';
import { MiddlewareModel } from '../../middleware/MiddlewareModel';

export const NoDocumentStorePlugin: DocumentStorePlugin = {
  upsertDocument: async ({ traceId }: UpsertRequest): Promise<UpsertResult> => {
    Logger.warn('NoDocumentStorePlugin.upsertDocument(): No backend plugin has been configured', traceId);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },

  getDocumentById: async ({ traceId }: GetRequest): Promise<GetResult> => {
    Logger.warn('NoDocumentStorePlugin.getDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE', document: {} });
  },

  updateDocumentById: async ({ traceId }: UpdateRequest): Promise<UpdateResult> => {
    Logger.warn('NoDocumentStorePlugin.updateDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },

  deleteDocumentById: async ({ traceId }: DeleteRequest): Promise<DeleteResult> => {
    Logger.warn('NoDocumentStorePlugin.deleteDocumentById(): No backend plugin has been configured', traceId);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE', failureMessage: '' });
  },

  securityMiddleware: async (middlewareModel: MiddlewareModel): Promise<MiddlewareModel> => {
    Logger.warn(
      'NoDocumentStorePlugin.securityMiddleware(): No backend plugin has been configured',
      middlewareModel.frontendRequest.traceId,
    );
    return Promise.resolve(middlewareModel);
  },
};

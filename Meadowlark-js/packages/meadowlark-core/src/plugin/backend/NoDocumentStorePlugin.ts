// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-utilities';
import { GetRequest } from '../../message/GetRequest';
import { GetResult } from '../../message/GetResult';
import { DeleteRequest } from '../../message/DeleteRequest';
import { DeleteResult } from '../../message/DeleteResult';
import { UpdateRequest } from '../../message/UpdateRequest';
import { UpdateResult } from '../../message/UpdateResult';
import { UpsertRequest } from '../../message/UpsertRequest';
import { UpsertResult } from '../../message/UpsertResult';
import { DocumentStorePlugin } from './DocumentStorePlugin';
import { MiddlewareModel } from '../../middleware/MiddlewareModel';
import { DocumentUuid } from '../../model/IdTypes';

const moduleName = 'core.plugin.backend.NoDocumentStorePlugin';

export const NoDocumentStorePlugin: DocumentStorePlugin = {
  upsertDocument: async ({ traceId }: UpsertRequest): Promise<UpsertResult> => {
    Logger.warn(`${moduleName}.upsertDocument No backend plugin has been configured`, traceId);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },

  getDocumentById: async ({ traceId }: GetRequest): Promise<GetResult> => {
    Logger.warn(`${moduleName}.getDocumentById No backend plugin has been configured`, traceId);
    return Promise.resolve({
      response: 'UNKNOWN_FAILURE',
      edfiDoc: {},
      documentUuid: '' as DocumentUuid,
      lastModifiedDate: 0,
    });
  },

  updateDocumentById: async ({ traceId }: UpdateRequest): Promise<UpdateResult> => {
    Logger.warn(`${moduleName}.updateDocumentById No backend plugin has been configured`, traceId);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE' });
  },

  deleteDocumentById: async ({ traceId }: DeleteRequest): Promise<DeleteResult> => {
    Logger.warn(`${moduleName}.deleteDocumentById No backend plugin has been configured`, traceId);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE', failureMessage: '' });
  },

  securityMiddleware: async (middlewareModel: MiddlewareModel): Promise<MiddlewareModel> => {
    Logger.warn(
      `${moduleName}.securityMiddleware No backend plugin has been configured`,
      middlewareModel.frontendRequest.traceId,
    );
    return Promise.resolve(middlewareModel);
  },

  closeConnection: async (): Promise<void> => {
    Logger.warn(`${moduleName}.closeConnection No backend plugin has been configured`, '');
  },
};

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { QueryRequest } from '../../message/QueryRequest';
import { QueryResult } from '../../message/QueryResult';
import { Logger } from '../../Logger';
import { QueryHandlerPlugin } from './QueryHandlerPlugin';

export const NoQueryHandlerPlugin: QueryHandlerPlugin = {
  queryDocuments: ({ traceId }: QueryRequest): Promise<QueryResult> => {
    Logger.warn('NoQueryHandlerPlugin.queryDocuments(): No backend plugin has been configured', traceId);
    return Promise.resolve({ response: 'UNKNOWN_FAILURE', documents: [] });
  },
};

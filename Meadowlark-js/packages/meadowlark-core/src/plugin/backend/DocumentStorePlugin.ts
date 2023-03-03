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
import { MiddlewareModel } from '../../middleware/MiddlewareModel';

export interface DocumentStorePlugin {
  upsertDocument: (request: UpsertRequest) => Promise<UpsertResult>;

  getDocumentById: (request: GetRequest) => Promise<GetResult>;

  updateDocumentById: (request: UpdateRequest) => Promise<UpdateResult>;

  deleteDocumentById: (request: DeleteRequest) => Promise<DeleteResult>;

  securityMiddleware: (middlewareModel: MiddlewareModel) => Promise<MiddlewareModel>;

  closeConnection: () => Promise<void>;
}

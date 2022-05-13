// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { GetRequest } from './GetRequest';
import { GetResult } from './GetResult';
import { DeleteRequest } from './DeleteRequest';
import { DeleteResult } from './DeleteResult';
import { UpdateRequest } from './UpdateRequest';
import { UpdateResult } from './UpdateResult';
import { UpsertRequest } from './UpsertRequest';
import { UpsertResult } from './UpsertResult';
import { QueryRequest } from './QueryRequest';
import { QueryResult } from './QueryResult';

export interface MeadowlarkBackendPlugin {
  upsertDocument: (request: UpsertRequest) => Promise<UpsertResult>;

  getDocumentById: (request: GetRequest) => Promise<GetResult>;

  getDocumentList: (request: QueryRequest) => Promise<GetResult>;

  updateDocumentById: (request: UpdateRequest) => Promise<UpdateResult>;

  deleteDocumentById: (request: DeleteRequest) => Promise<DeleteResult>;

  queryDocumentList: (request: QueryRequest) => Promise<QueryResult>;
}

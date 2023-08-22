// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { TraceId } from '../model/IdTypes';
import { ResourceInfo } from '../model/ResourceInfo';
import { Security } from '../security/Security';
import { PaginationParameters } from './PaginationParameters';

export type QueryRequest = {
  resourceInfo: ResourceInfo;
  queryParameters: object;
  paginationParameters: PaginationParameters;
  traceId: TraceId;
  security: Security;
};

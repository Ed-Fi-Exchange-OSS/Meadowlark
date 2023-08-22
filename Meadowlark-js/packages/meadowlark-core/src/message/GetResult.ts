// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid } from '../model/IdTypes';

export type GetResult = {
  response: 'GET_SUCCESS' | 'GET_FAILURE_NOT_EXISTS' | 'GET_FAILURE_AUTHORIZATION' | 'UNKNOWN_FAILURE';
  documentUuid: DocumentUuid;
  edfiDoc: object;
  lastModifiedDate: number;
  securityResolved?: string[];
  failureMessage?: string;
};

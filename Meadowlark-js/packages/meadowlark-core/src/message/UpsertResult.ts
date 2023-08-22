// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid } from '../model/IdTypes';
import { ReferringDocumentInfo } from './ReferringDocumentInfo';

type UpsertFailureBlocked = {
  response: 'INSERT_FAILURE_REFERENCE' | 'INSERT_FAILURE_CONFLICT' | 'UPDATE_FAILURE_REFERENCE';
  failureMessage?: string | object;
  referringDocumentInfo: ReferringDocumentInfo[];
};

export type UpsertResult =
  | UpsertFailureBlocked
  | { response: 'INSERT_SUCCESS'; failureMessage?: string | object; newDocumentUuid: DocumentUuid }
  | { response: 'UPDATE_SUCCESS'; failureMessage?: string | object; existingDocumentUuid: DocumentUuid }
  | { response: 'UPSERT_FAILURE_WRITE_CONFLICT'; failureMessage?: string | object }
  | { response: 'UNKNOWN_FAILURE'; failureMessage?: string | object };

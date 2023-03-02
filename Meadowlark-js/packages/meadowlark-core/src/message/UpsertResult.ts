// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid } from '../model/BrandedTypes';
import { BlockingDocument } from './BlockingDocument';

type UpsertFailureBlocked = {
  response: 'INSERT_FAILURE_REFERENCE' | 'INSERT_FAILURE_CONFLICT' | 'UPDATE_FAILURE_REFERENCE';
  failureMessage?: string | object;
  blockingDocuments: BlockingDocument[];
};

export type UpsertResult =
  | UpsertFailureBlocked
  | { response: 'INSERT_SUCCESS'; failureMessage?: string | object }
  | { response: 'UPDATE_SUCCESS'; failureMessage?: string | object; existingDocumentUuid: DocumentUuid }
  | { response: 'UNKNOWN_FAILURE'; failureMessage?: string | object };

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { BlockingDocument } from './BlockingDocument';

export type UpdateFailureReference = {
  response: 'UPDATE_FAILURE_REFERENCE';
  failureMessage?: string | object;
  blockingDocuments: BlockingDocument[];
};

export type UpdateResult =
  | UpdateFailureReference
  | { response: 'UPDATE_SUCCESS'; failureMessage?: string | object }
  | { response: 'UPDATE_FAILURE_NOT_EXISTS'; failureMessage?: string | object }
  | { response: 'UPDATE_FAILURE_WRITE_CONFLICT'; failureMessage?: string | object }
  | { response: 'UPDATE_FAILURE_AUTHORIZATION'; failureMessage?: string | object }
  | { response: 'UNKNOWN_FAILURE'; failureMessage?: string | object };

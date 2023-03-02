// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { BlockingDocument } from './BlockingDocument';

export type DeleteFailureReference = {
  response: 'DELETE_FAILURE_REFERENCE';
  blockingDocuments: BlockingDocument[];
};

export type DeleteResult =
  | DeleteFailureReference
  | { response: 'DELETE_SUCCESS' }
  | { response: 'DELETE_FAILURE_NOT_EXISTS' }
  | { response: 'DELETE_FAILURE_WRITE_CONFLICT' }
  | { response: 'DELETE_FAILURE_AUTHORIZATION'; failureMessage: string }
  | { response: 'UNKNOWN_FAILURE'; failureMessage: string };

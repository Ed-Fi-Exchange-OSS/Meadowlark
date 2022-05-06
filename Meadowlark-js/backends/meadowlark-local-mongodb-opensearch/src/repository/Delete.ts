// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo, DeleteResult, Security } from '@edfi/meadowlark-core';

export async function deleteDocumentById(
  _id: string,
  _documentInfo: DocumentInfo,
  _validate: boolean,
  _security: Security,
  _traceId: string,
): Promise<DeleteResult> {
  return { result: 'UNKNOWN_FAILURE' };
}

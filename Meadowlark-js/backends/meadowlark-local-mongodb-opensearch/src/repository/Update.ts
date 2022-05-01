// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EntityInfo, Security, ValidationOptions, PutResult } from '@edfi/meadowlark-core';

export async function updateEntityById(
  _id: string,
  _entityInfo: EntityInfo,
  _info: object,
  _validationOptions: ValidationOptions,
  _security: Security,
  _lambdaRequestId: string,
): Promise<PutResult> {
  return { result: 'UNKNOWN_FAILURE', failureMessage: 'Not Implemented' };
}

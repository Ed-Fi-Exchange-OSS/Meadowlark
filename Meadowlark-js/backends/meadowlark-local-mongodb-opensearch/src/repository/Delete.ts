// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EntityInfo, DeleteResult } from '@edfi/meadowlark-core';

export async function deleteEntityById(
  _id: string,
  _entityInfo: EntityInfo,
  _lambdaRequestId: string,
): Promise<DeleteResult> {
  return { success: false };
}

export async function deleteItems(_items: { pk: string; sk: string }[], _awsRequestId: string): Promise<DeleteResult> {
  return { success: false };
}

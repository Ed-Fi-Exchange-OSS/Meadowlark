// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { EntityInfo, ForeignKeyItem, DeleteResult, OwnershipResult } from '@edfi/meadowlark-core';

export async function getReferencesToThisItem(
  _id: string,
  _entityInfo: EntityInfo,
  _lambdaRequestId: string,
): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> {
  return { success: false, foreignKeys: [] };
}

export async function getForeignKeyReferences(
  _id: string,
  _entityInfo: EntityInfo,
  _lambdaRequestId: string,
): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> {
  return { success: false, foreignKeys: [] };
}

export async function deleteItems(_items: { pk: string; sk: string }[], _awsRequestId: string): Promise<DeleteResult> {
  return { success: false };
}

export async function validateEntityOwnership(
  _id: string,
  _entityInfo: EntityInfo,
  _clientName: string | null,
  _lambdaRequestId: string,
): Promise<OwnershipResult> {
  return { result: 'ERROR', isOwner: false };
}

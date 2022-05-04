// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DeleteResult, DocumentInfo, Security, ValidationOptions } from '@edfi/meadowlark-core';
import {
  deleteEntityByIdDynamo,
  deleteItems,
  getForeignKeyReferences,
  getReferencesToThisItem,
  validateEntityOwnership,
} from './DynamoEntityRepository';

/**
 * Deletes the primary item from DynamoDB.
 */
export async function deleteEntityById(
  id: string,
  documentInfo: DocumentInfo,
  _validationOptions: ValidationOptions,
  security: Security,
  awsRequestId: string,
): Promise<DeleteResult> {
  try {
    if (security.isOwnershipEnabled) {
      const { isOwner, result: ownershipResult } = await validateEntityOwnership(
        id,
        documentInfo,
        security.clientName,
        awsRequestId,
      );

      if (ownershipResult === 'ERROR') {
        return { result: 'UNKNOWN_FAILURE' };
      }

      if (ownershipResult === 'NOT_FOUND') {
        return { result: 'DELETE_FAILURE_NOT_EXISTS' };
      }

      if (!isOwner) {
        return { result: 'DELETE_FAILURE_NOT_EXISTS' };
      }
    }

    const foreignKeysLookup = await getReferencesToThisItem(id, documentInfo, awsRequestId);
    if (!foreignKeysLookup.success || foreignKeysLookup.foreignKeys?.length > 0) {
      const fks = foreignKeysLookup.foreignKeys.map((fk) => fk.Description);
      const failureMessage = JSON.stringify({
        error: 'Unable to delete this item because there are foreign keys pointing to it',
        foreignKeys: fks,
      });

      return { result: 'DELETE_FAILURE_REFERENCE', failureMessage };
    }

    const { success } = await deleteEntityByIdDynamo(id, documentInfo, awsRequestId);

    if (!success) {
      return { result: 'UNKNOWN_FAILURE' };
    }

    // Now that the main object has been deleted, we need to delete the foreign key references
    const { success: fkSuccess, foreignKeys } = await getForeignKeyReferences(id, documentInfo, awsRequestId);

    if (fkSuccess) {
      // Delete the (FREF, TREF) records
      await deleteItems(
        foreignKeys.map((i) => ({ pk: i.From, sk: i.To })),
        awsRequestId,
      );
      // And now reverse that, to delete the (TREF, FREF) records
      await deleteItems(
        foreignKeys.map((i) => ({ pk: i.To, sk: i.From })),
        awsRequestId,
      );
    } // Else: user can't resolve this error, and it should be logged already. Ignore.

    return { result: 'DELETE_SUCCESS' };
  } catch (e) {
    return { result: 'UNKNOWN_FAILURE' };
  }
}

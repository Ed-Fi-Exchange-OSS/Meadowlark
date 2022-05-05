// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, UpdateResult, ClientSession } from 'mongodb';
import {
  DocumentInfo,
  Security,
  ValidationOptions,
  PutResult,
  documentIdForDocumentReference,
  DocumentReference,
  Logger,
} from '@edfi/meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getMongoDocuments, getClient } from './Db';

export async function upsertDocument(
  id: string,
  documentInfo: DocumentInfo,
  info: object,
  _validationOptions: ValidationOptions,
  _security: Security,
  lambdaRequestId: string,
): Promise<PutResult> {
  const mongoDocuments: Collection<MeadowlarkDocument> = getMongoDocuments();

  const document: MeadowlarkDocument = {
    id,
    documentIdentity: documentInfo.documentIdentity,
    projectName: documentInfo.projectName,
    resourceName: documentInfo.resourceName,
    resourceVersion: documentInfo.resourceVersion,
    edfiDoc: info,
    outRefs: documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr)),
  };

  const session: ClientSession = getClient().startSession();

  let result: any = null;

  try {
    await session.withTransaction(async () => {
      result = await mongoDocuments.replaceOne({ id }, document, { upsert: true, session });

      // const usersUpdateResults = await usersCollection.updateOne(
      //   { email: userEmail },
      //   { $addToSet: { reservations: reservation } },
      //   { session },
      // );
      // console.log(
      //   `${usersUpdateResults.matchedCount} document(s) found in the users collection with the email address ${userEmail}.`,
      // );
      // console.log(`${usersUpdateResults.modifiedCount} document(s) was/were updated to include the reservation.`);

      // const isListingReservedResults = await listingsAndReviewsCollection.findOne(
      //   { name: nameOfListing, datesReserved: { $in: reservationDates } },
      //   { session },
      // );
      // if (isListingReservedResults) {
      //   await session.abortTransaction();
      //   console.error(
      //     'This listing is already reserved for at least one of the given dates. The reservation could not be created.',
      //   );
      //   console.error('Any operations that already occurred as part of this transaction will be rolled back.');
      //   return;
      // }
    });
  } catch (e) {
    Logger.error(`mongodb.repository.Upsert.upsertDocument`, lambdaRequestId, e);
    return { result: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  if (result == null) return { result: 'UNKNOWN_FAILURE' };

  if ((result as UpdateResult).upsertedCount === 0) return { result: 'UPDATE_SUCCESS' };
  return { result: 'INSERT_SUCCESS' };
}

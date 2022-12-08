// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { pluralize, uncapitalize } from '@edfi/metaed-plugin-edfi-meadowlark';
import { isDebugEnabled, writeErrorToLog } from '@edfi/meadowlark-utilities';
import { writeDebugStatusToLog, writeRequestToLog } from '../Logger';
import { getDocumentStore } from '../plugin/PluginLoader';
import { beforeDeleteDocumentById, afterDeleteDocumentById } from '../plugin/listener/Publish';
import { DeleteRequest } from '../message/DeleteRequest';
import { DeleteResult } from '../message/DeleteResult';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';
import { BlockingDocument } from '../message/BlockingDocument';
import { resourceUriFrom } from './UriBuilder';
import { versionAbbreviationFor } from '../metaed/MetaEdProjectMetadata';

const moduleName = 'core.handler.Delete';

const DELETE_FAILURE_REFERENCE_MESSAGE: string =
  'The resource cannot be deleted because it is a dependency of other documents';

/**
 * For generating problem details when a document references the document to be deleted.
 */
function blockingDocumentsToUris(frontendRequest: FrontendRequest, blockingDocuments: BlockingDocument[]): string[] {
  const result: string[] = [];
  blockingDocuments.forEach((document) => {
    let uri = resourceUriFrom(
      {
        version: versionAbbreviationFor(document.resourceVersion),
        namespace: document.projectName.toLowerCase(), // Lower casing is correct for Ed-Fi models, not sure about alternatives
        resourceName: uncapitalize(pluralize(document.resourceName)),
      },
      document.documentId,
    );
    if (frontendRequest.stage !== '') uri = `/${frontendRequest.stage}${uri}`;
    result.push(uri);
  });
  return result;
}

/**
 * Entry point for all API DELETE requests, which are "by id"
 *
 * Forwards to datastore backend for deletion
 */
export async function deleteIt(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  try {
    writeRequestToLog(moduleName, frontendRequest, 'deleteIt');

    if (frontendRequest.middleware.pathComponents.resourceId == null) {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return { body: '', statusCode: 404 };
    }

    const request: DeleteRequest = {
      id: frontendRequest.middleware.pathComponents.resourceId,
      resourceInfo: frontendRequest.middleware.resourceInfo,
      validate: frontendRequest.middleware.validateResources,
      security: frontendRequest.middleware.security,
      traceId: frontendRequest.traceId,
    };

    await beforeDeleteDocumentById(request);
    const result: DeleteResult = await getDocumentStore().deleteDocumentById(request);
    await afterDeleteDocumentById(request, result);

    if (result.response === 'DELETE_SUCCESS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 204);
      return { body: '', statusCode: 204, headers: frontendRequest.middleware.headerMetadata };
    }

    if (result.response === 'DELETE_FAILURE_NOT_EXISTS') {
      writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 404);
      return { body: '', statusCode: 404, headers: frontendRequest.middleware.headerMetadata };
    }

    if (result.response === 'DELETE_FAILURE_REFERENCE') {
      const blockingUris: string[] = blockingDocumentsToUris(frontendRequest, result.blockingDocuments);

      if (isDebugEnabled()) {
        writeDebugStatusToLog(moduleName, frontendRequest, 'deleteIt', 409, blockingUris.join(','));
      }

      return {
        body: JSON.stringify({ message: DELETE_FAILURE_REFERENCE_MESSAGE, blockingUris }),
        statusCode: 409,
        headers: frontendRequest.middleware.headerMetadata,
      };
    }

    writeErrorToLog(moduleName, frontendRequest.traceId, 'deleteIt', 500, result.failureMessage);
    return {
      body: JSON.stringify({ message: result.failureMessage ?? 'Failure' }),
      statusCode: 500,
      headers: frontendRequest.middleware.headerMetadata,
    };
  } catch (e) {
    writeErrorToLog(moduleName, frontendRequest.traceId, 'deleteIt', 500, e);
    return { body: '', statusCode: 500 };
  }
}

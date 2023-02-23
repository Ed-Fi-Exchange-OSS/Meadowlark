// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { pluralize, uncapitalize } from '@edfi/metaed-plugin-edfi-meadowlark';
import { PathComponents } from '../model/PathComponents';
import { FrontendRequest } from './FrontendRequest';
import { BlockingDocument } from '../message/BlockingDocument';
import { versionAbbreviationFor } from '../metaed/MetaEdProjectMetadata';

/**
 * Derives the resource URI from the pathComponents and resourceId
 */
export function resourceUriFrom(pathComponents: PathComponents, documentUuid: string): string {
  return `/${pathComponents.version}/${pathComponents.namespace}/${pathComponents.resourceName}/${documentUuid}`;
}

/**
 * For generating problem details when a document references the document to be deleted.
 */
export function blockingDocumentsToUris(frontendRequest: FrontendRequest, blockingDocuments?: BlockingDocument[]): string[] {
  const result: string[] = [];
  if (blockingDocuments) {
    blockingDocuments.forEach((document) => {
      let uri = resourceUriFrom(
        {
          version: versionAbbreviationFor(document.resourceVersion),
          namespace: document.projectName.toLowerCase(), // Lower casing is correct for Ed-Fi models, not sure about alternatives
          resourceName: uncapitalize(pluralize(document.resourceName)),
        },
        document.documentUuid,
      );
      if (frontendRequest.stage !== '') uri = `/${frontendRequest.stage}${uri}`;
      result.push(uri);
    });
  }
  return result;
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { pluralize, uncapitalize } from '@edfi/metaed-plugin-edfi-api-schema';
import { PathComponents } from '../model/PathComponents';
import { FrontendRequest } from './FrontendRequest';
import { ReferringDocumentInfo } from '../message/ReferringDocumentInfo';
import { versionAbbreviationFor } from '../api-schema/ApiSchemaLoader';
import { ProjectNamespace } from '../model/api-schema/ProjectNamespace';
import { EndpointName } from '../model/api-schema/EndpointName';

/**
 * Derives the resource URI from the pathComponents and resourceId
 */
export function resourceUriFrom(pathComponents: PathComponents, documentUuid: string): string {
  return `/${pathComponents.projectShortVersion}/${pathComponents.projectNamespace}/${pathComponents.endpointName}/${documentUuid}`;
}

/**
 * For generating problem details when a document references the document to be deleted.
 */
export function blockingDocumentsToUris(
  frontendRequest: FrontendRequest,
  referringDocumentInfo?: ReferringDocumentInfo[],
): string[] {
  const result: string[] = [];
  if (referringDocumentInfo) {
    referringDocumentInfo.forEach((document) => {
      let uri = resourceUriFrom(
        {
          projectShortVersion: versionAbbreviationFor(document.resourceVersion),
          projectNamespace: document.projectName.toLowerCase() as ProjectNamespace, // Lower casing is correct for Ed-Fi models, not sure about alternatives
          endpointName: uncapitalize(pluralize(document.resourceName)) as EndpointName,
        },
        document.documentUuid,
      );
      if (frontendRequest.stage !== '') uri = `/${frontendRequest.stage}${uri}`;
      result.push(uri);
    });
  }
  return result;
}

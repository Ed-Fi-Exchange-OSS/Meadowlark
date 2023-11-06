// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import invariant from 'ts-invariant';
import { PathComponents } from '../model/PathComponents';
import { FrontendRequest } from './FrontendRequest';
import { ReferringDocumentInfo } from '../message/ReferringDocumentInfo';
import { ProjectNamespace } from '../model/api-schema/ProjectNamespace';
import { EndpointName } from '../model/api-schema/EndpointName';
import { SemVer } from '../model/api-schema/SemVer';
import { ProjectShortVersion } from '../model/ProjectShortVersion';

// TODO: See RND-382 on what to do with this
function versionAbbreviationFor(_resourceVersion: SemVer): ProjectShortVersion {
  return '3.3b' as ProjectShortVersion;
}

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
  const { apiSchema } = frontendRequest.middleware;
  if (referringDocumentInfo) {
    referringDocumentInfo.forEach((document) => {
      const projectNamespace: ProjectNamespace | undefined = apiSchema.projectNameMapping[document.projectName];
      invariant(
        projectNamespace != null,
        `Project name '${document.projectName}' on document resource ${document.resourceName} with documentUuid ${document.documentUuid} does not match any known ProjectNamespace. Mismatch between database data and loaded ApiSchema?`,
      );

      const endpointName: EndpointName | undefined =
        apiSchema.projectSchemas[projectNamespace].resourceNameMapping[document.resourceName];
      invariant(
        endpointName != null,
        `Resource name '${document.resourceName}' on document with documentUuid ${document.documentUuid} does not match any known EndpointName. Mismatch between database data and loaded ApiSchema?`,
      );

      let uri = resourceUriFrom(
        {
          projectShortVersion: versionAbbreviationFor(document.resourceVersion),
          projectNamespace,
          endpointName,
        },
        document.documentUuid,
      );
      if (frontendRequest.stage !== '') uri = `/${frontendRequest.stage}${uri}`;
      result.push(uri);
    });
  }
  return result;
}

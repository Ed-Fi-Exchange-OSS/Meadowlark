// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid, MeadowlarkId } from '../model/IdTypes';
import { MetaEdProjectName } from '../model/api-schema/MetaEdProjectName';
import { MetaEdResourceName } from '../model/api-schema/MetaEdResourceName';
import { SemVer } from '../model/api-schema/SemVer';

/**
 * Information on a document that is referring another document for referential integrity reasons
 */
export type ReferringDocumentInfo = {
  projectName: MetaEdProjectName;
  resourceVersion: SemVer;
  resourceName: MetaEdResourceName;
  documentUuid: DocumentUuid;
  meadowlarkId: MeadowlarkId;
};

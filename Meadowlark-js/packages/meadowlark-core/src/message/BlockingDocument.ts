// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid, MeadowlarkId } from '../model/BrandedTypes';

/**
 * Information on a document that is blocking the delete of another document for referential integrity reasons
 */
export type BlockingDocument = {
  projectName: string;
  resourceVersion: string;
  resourceName: string;
  documentUuid: DocumentUuid;
  meadowlarkId: MeadowlarkId;
};

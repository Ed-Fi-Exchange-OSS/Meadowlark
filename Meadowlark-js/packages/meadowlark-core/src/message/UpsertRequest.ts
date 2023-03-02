// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid, MeadowlarkId, TraceId } from '../model/BrandedTypes';
import { DocumentInfo } from '../model/DocumentInfo';
import { ResourceInfo } from '../model/ResourceInfo';
import { Security } from '../security/Security';

export type UpsertRequest = {
  meadowlarkId: MeadowlarkId;
  documentUuidForInsert: DocumentUuid;
  resourceInfo: ResourceInfo;
  documentInfo: DocumentInfo;
  edfiDoc: object;
  validateDocumentReferencesExist: boolean;
  security: Security;
  traceId: TraceId;
};

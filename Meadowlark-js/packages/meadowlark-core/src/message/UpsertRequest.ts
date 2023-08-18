// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkId, TraceId } from '../model/IdTypes';
import { DocumentInfo } from '../model/DocumentInfo';
import { ResourceInfo } from '../model/ResourceInfo';
import { Security } from '../security/Security';

export interface UpsertRequest {
  meadowlarkId: MeadowlarkId;
  resourceInfo: ResourceInfo;
  documentInfo: DocumentInfo;
  edfiDoc: object;
  validateDocumentReferencesExist: boolean;
  security: Security;
  traceId: TraceId;
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentUuid, TraceId } from '../model/IdTypes';
import { ResourceInfo } from '../model/ResourceInfo';
import { Security } from '../security/Security';

export type GetRequest = {
  documentUuid: DocumentUuid;
  resourceInfo: ResourceInfo;
  security: Security;
  traceId: TraceId;
};

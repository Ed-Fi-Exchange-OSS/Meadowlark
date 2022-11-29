// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import type { AuthorizationClientRole } from '../model/AuthorizationClientRole';

export type CreateAuthorizationClientRequest = {
  clientId: string;
  clientSecretHashed: string;
  clientName: string;
  active: boolean;
  roles: AuthorizationClientRole[];
  traceId: string;
};

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Jwt as nJwt, JwtBody as nJwtBody } from 'njwt';

interface JwtBody extends nJwtBody {
  iss?: string;
  aud?: string;
  sub?: string;
  client_id?: string;
  iat?: number;
  exp?: number;
  roles?: string[];
}

/**
 * Improve on nJwt's typings
 */
export interface Jwt extends nJwt {
  message: string;
  body: JwtBody;
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { AuthorizationStrategy } from './AuthorizationStrategy';

/**
 * Information extracted from a JWT token
 */
export interface JwtStatus {
  isMissing: boolean;
  isValid: boolean;
  isExpired: boolean;
  issuer: string;
  audience: string;
  subject: string | null;
  clientId: string | null;
  issuedAt: number;
  expiresAt: number;
  roles: string[];
  authorizationStrategy: AuthorizationStrategy;
}

export function newJwtStatus(): JwtStatus {
  return {
    isMissing: false,
    isValid: false,
    isExpired: false,
    issuer: '',
    audience: '',
    subject: null,
    clientId: null,
    issuedAt: 0,
    expiresAt: 0,
    roles: [],
    authorizationStrategy: { type: 'UNDEFINED', withAssessment: false },
  };
}

export const NoJwtStatus = Object.freeze(newJwtStatus());

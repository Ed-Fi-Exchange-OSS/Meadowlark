// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { AuthorizationStrategy } from './AuthorizationStrategy';

/**
 * The security information associated with a frontend request
 */
export type Security = {
  // Security via document ownership
  authorizationStrategy: AuthorizationStrategy;
  // Client Id string pulled from JWT client_id
  clientId: string;
};

export function newSecurity(): Security {
  return {
    authorizationStrategy: { type: 'UNDEFINED', withAssessment: false },
    clientId: 'UNKNOWN',
  };
}

export const UndefinedSecurity = Object.freeze(newSecurity());

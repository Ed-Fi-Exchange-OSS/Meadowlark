// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { IntrospectedToken } from '../security/IntrospectedToken';

export type TokenErrorResponse = {
  error: string | object;
  error_description?: string;
};

export type TokenSuccessResponse = {
  access_token: string;
  token_type: 'bearer';
  expires_in?: number;
  refresh_token: string;
};

export type IntrospectionResponse = { isValid: false } | { isValid: true; introspectedToken: IntrospectedToken };

export type VerificationResponse = { active: false } | IntrospectedToken;

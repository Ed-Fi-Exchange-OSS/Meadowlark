// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Headers } from '../handler/FrontendRequest';

/*
 * Resolves Authorization header from a FrontendRequest object. Handles
 * lowercased header names in the header object
 */
export function authorizationHeader(headers: Headers): string | undefined {
  return headers.Authorization ?? headers.authorization;
}

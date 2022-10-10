// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export interface AuthorizationResponse {
  statusCode: number;
  headers?: { [header: string]: string } | undefined;
  body: string;
}

export function newAuthorizationResponse(): AuthorizationResponse {
  return {
    statusCode: 0,
    headers: {},
    body: '',
  };
}

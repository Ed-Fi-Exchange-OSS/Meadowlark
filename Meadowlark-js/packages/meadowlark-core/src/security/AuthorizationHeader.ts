// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { APIGatewayProxyEvent } from 'aws-lambda';

/*
 * Resolves Authorization header from an APIGatewayProxyEvent object. Local API Gateway emulation seems
 * to lowercase header names in the header object
 */
export function authorizationHeader(event: APIGatewayProxyEvent): string | undefined {
  return event.headers.Authorization ?? event.headers.authorization;
}

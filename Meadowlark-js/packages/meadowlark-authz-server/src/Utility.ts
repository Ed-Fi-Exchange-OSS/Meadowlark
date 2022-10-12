// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export function clientIdFrom(path: string): string {
  // Assumes client id is at the 3rd position:
  // /oauth/client/11111111-1111-1111-1111111111111111
  const pathExpression = /\/(?<oauth>[^/]+)\/(?<client>[^/]+)\/((?<clientId>[^/]*$))?/gm;
  const match = pathExpression.exec(path);

  if (match?.groups == null) return '';

  const { clientId } = match.groups ?? '';
  return clientId;
}

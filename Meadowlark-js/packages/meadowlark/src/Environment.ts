// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

type EnvironmentVariable = 'ACCESS_TOKEN_REQUIRED' | 'SIGNING_KEY' | 'TOKEN_URL';

export function getValueFromEnvironment(key: EnvironmentVariable): string {
  const value = process.env[key];

  if (value != null) {
    return value;
  }

  throw new Error(`Environment variable '${key}' has not been setup properly.`);
}

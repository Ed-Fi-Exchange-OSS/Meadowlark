// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type GetResult = {
  result: 'ERROR' | 'NOT_FOUND' | 'SUCCESS' | 'AUTHORIZATION_FAILURE' | 'LEGACY_AUTHORIZATION_FAILURE';
  documents: Array<object>;
  securityResolved?: string[];
};

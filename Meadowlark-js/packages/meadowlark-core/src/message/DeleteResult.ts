// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type DeleteResult = {
  response:
    | 'DELETE_SUCCESS'
    | 'DELETE_FAILURE_REFERENCE'
    | 'DELETE_FAILURE_NOT_EXISTS'
    | 'DELETE_FAILURE_AUTHORIZATION'
    | 'UNKNOWN_FAILURE';
  failureMessage?: string;
};

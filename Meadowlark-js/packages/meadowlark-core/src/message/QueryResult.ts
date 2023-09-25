// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export type QueryResult = {
  response:
    | 'QUERY_SUCCESS'
    | 'QUERY_FAILURE_INVALID_QUERY'
    | 'QUERY_FAILURE_AUTHORIZATION'
    | 'UNKNOWN_FAILURE'
    | 'QUERY_FAILURE_INDEX_NOT_FOUND'
    | 'QUERY_FAILURE_CONNECTION_ERROR';
  documents: Array<object>;
  failureMessage?: string;
  totalCount?: number;
};

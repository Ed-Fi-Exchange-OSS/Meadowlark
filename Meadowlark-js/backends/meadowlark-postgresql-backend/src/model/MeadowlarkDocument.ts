// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export interface MeadowlarkDocumentId {
  /**
   * A string hash derived from the project name, resource name, resource version
   * and identity of the API document. This field will be a unique index on the collection.
   */
  id: string;
}

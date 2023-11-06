// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentObjectKey } from './DocumentObjectKey';

export type AbstractResourceInfo = {
  /**
   * A list of the DocumentObjectKey paths that are part of the identity for this resource, in lexical order.
   * Duplicates due to key unification are removed.
   */
  identityPathOrder: DocumentObjectKey[];
};

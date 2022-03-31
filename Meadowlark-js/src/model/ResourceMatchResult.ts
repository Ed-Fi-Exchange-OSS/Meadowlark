// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { TopLevelEntity } from '@edfi/metaed-core';

/** The result of an attempt to match a resource name to a MetaEd model object */
export type ResourceMatchResult = {
  /**
   * The resource name resulting from the match attempt.  Either an exact match, a suggestion,
   * or the empty string
   */
  resourceName: string;

  /**
   * Whether this match is with a descriptor
   */
  isDescriptor: boolean;

  /**
   * True if the resourceName is an exact match
   */
  exact: boolean;

  /**
   * True if the resourceName is a suggestion
   */
  suggestion: boolean;

  /**
   * If resourceName is an exact match, this is the matching MetaEd model object.
   * Otherwise, it's a null object.
   */
  matchingMetaEdModel: TopLevelEntity;
};

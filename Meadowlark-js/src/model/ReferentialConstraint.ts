// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { PropertyType, ModelType } from '@edfi/metaed-core';

export type ReferentialConstraint = {
  /**
   * The MetaEd entity type of the referenced entity.
   * Example: 'domainEntity'
   */
  metaEdType: PropertyType | ModelType;
  /**
   * The MetaEd name of the referenced entity.
   * Example: 'School'
   */
  metaEdName: string;
  /**
   * True if the referenced entity is assignable from other entities (meaning it is a superclass),
   *
   * Example 1: School is not a superclass. isAssignableFrom would be false if the reference
   *            was to a School.
   * Example 2: EducationOrganization is a superclass of School, LocalEducationAgency, and others. isAssignableFrom
   *            would be true if the reference was to an EducationOrganization.
   */
  isAssignableFrom: boolean;
  /**
   * The constraint string for this referential constraint.
   * For example, this could be a natural key string or a full descriptor URI.
   */
  constraintKey: string;
};

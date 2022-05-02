// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentIdentity } from './DocumentIdentity';

/**
 * The optional assignability information for a DocumentInfo. An assignable entity is one that is part of a
 * subclass/superclass relationship, meaning that a subclass can be "assigned to" a superclass reference.
 */
export type Assignable = {
  /**
   * This is the identity extracted from the document, but in the form of the superclass
   * identity. This only differs from the regular identity if the subclass has an identity elemnt renamed.
   *
   * Example: EducationOrganization has educationOrganizationId as its identity.
   *          School is a subclass of EducationOrganization and has identity renamed educationOrganizationId to schoolId.
   *          The assignableIdentity will use educationOrganizationId instead of schoolId.
   */
  assignableIdentity: DocumentIdentity;

  /**
   * If the entity for this mapping is in a subclass/superclass relationship, this is the MetaEd name of the
   * superclass entity which it can be assigned to. (MetaEd only allows a single level of subclassing.)
   *
   * Example 1: If the entity for this mapping is School (subclass of EducationOrganization),
   *            then the assignableToName would be EducationOrganization.
   * Example 2: If the entity is EducationOrganziation (a superclass), the assignableToName
   *            would also be EducationOrganization.
   */
  assignableToName: string;
};

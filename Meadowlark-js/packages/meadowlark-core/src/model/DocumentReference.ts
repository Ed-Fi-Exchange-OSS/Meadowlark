// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentIdentity } from './DocumentIdentity';

export type DocumentReference = {
  /**
   * The MetaEd project name the API document resource is defined in e.g. "EdFi" for a data standard entity.
   */
  projectName: string;

  /**
   * The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
   */
  resourceName: string;

  /**
   * The resource version as a string. This is the same as the MetaEd project version
   * the entity is defined in e.g. "3.3.1-b" for a 3.3b data standard entity.
   */
  resourceVersion: string;

  /**
   * Whether this document is a descriptor. Descriptors are treated differently from other documents
   */
  isDescriptor: boolean;

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
   * The document identity representing this reference.
   */
  documentIdentity: DocumentIdentity;
};

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { SchoolYearEnumerationDocument } from './SchoolYearEnumerationDocument';
import { DocumentIdentity } from './DocumentIdentity';
import { DocumentInfo, newDocumentInfo } from './DocumentInfo';

/**
 * Creates a new DocumentIdentity from the given SchoolYearEnumerationDocument
 */
export function schoolYearEnumerationDocumentIdentityFrom(
  schoolYearEnumerationDocument: SchoolYearEnumerationDocument,
): DocumentIdentity {
  return [
    {
      name: 'schoolYear',
      value: schoolYearEnumerationDocument.schoolYear.toString(),
    },
  ];
}

/**
 * Creates a new SchoolYearEnumerationDocumentInfo from the given SchoolYearEnumerationDocument
 */
export function schoolYearEnumerationDocumentInfoFrom(
  schoolYearEnumerationDocument: SchoolYearEnumerationDocument,
): DocumentInfo {
  return {
    ...newDocumentInfo(),
    documentIdentity: schoolYearEnumerationDocumentIdentityFrom(schoolYearEnumerationDocument),
  };
}

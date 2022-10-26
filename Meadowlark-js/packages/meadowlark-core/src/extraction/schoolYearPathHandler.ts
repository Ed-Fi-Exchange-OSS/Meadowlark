// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { ReferenceComponent } from '@edfi/metaed-plugin-edfi-meadowlark';
import { decapitalize } from '../Utility';

/**
 * School years are a unique entity within the Ed-Fi model and will have different signatures depending on their
 * placement within the model (i.e. the stand-alone entity vs. the entity as a reference) This can result the keys
 * generating differently, so adjustment is needed
 *
 * ****** Graduation Plan ******
 *
 *    "educationOrganizationReference": {
 *    "educationOrganizationId": 123
 *    },
 *    "graduationPlanTypeDescriptor": "uri://ed-fi.org/GraduationPlanTypeDescriptor#Minimum",
 *    "graduationSchoolYearTypeReference": {
 *    "schoolYear": 2024
 *    },
 *    "totalRequiredCredits": 100
 *
 * ****** Graduation Plan Reference ******
 *
 *    "graduationPlanReference": {
 *    "educationOrganizationId": 123,
 *    "graduationPlanTypeDescriptor": "uri://ed-fi.org/GraduationPlanTypeDescriptor#Minimum",
 *    "graduationSchoolYear": 2024
 *    }
 * @param referenceComponent The reference component for the model
 * @returns the updated string of the path to the school year
 */
export function schoolYearPathHandler(referenceComponent: ReferenceComponent): string {
  const { roleName } = referenceComponent.sourceProperty;
  if (roleName !== '') {
    return `${decapitalize(roleName)}SchoolYearTypeReference.schoolYear`;
  }
  return 'schoolYearTypeReference.schoolYear';
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { createResource } from './Resources';

export async function createContentClassDescriptor(): Promise<string> {
  return createResource({
    endpoint: 'contentClassDescriptors',
    role: 'host',
    body: {
      codeValue: 'Presentation',
      description: 'Presentation',
      shortDescription: 'Presentation',
      namespace: 'uri://ed-fi.org/ContentClassDescriptor',
    },
  });
}

export async function createGradeLevelDescriptor(): Promise<string> {
  return createResource({
    endpoint: 'gradeLevelDescriptors',
    role: 'host',
    body: {
      codeValue: 'Eighth',
      description: 'Eight Grade',
      shortDescription: '8°',
      namespace: 'uri://ed-fi.org/GradeLevelDescriptor',
    },
  });
}

export async function createAcademicSubjectDescriptor(): Promise<string> {
  return createResource({
    endpoint: 'academicSubjectDescriptors',
    role: 'host',
    body: {
      codeValue: 'Composite',
      description: 'Composite',
      shortDescription: 'Composite',
      namespace: 'uri://ed-fi.org/AcademicSubjectDescriptor',
    },
  });
}

export async function createCountry(): Promise<string> {
  return createResource({
    endpoint: 'countryDescriptors',
    role: 'host',
    body: {
      codeValue: 'US',
      shortDescription: 'US',
      description: 'US',
      namespace: 'uri://ed-fi.org/CountryDescriptor',
    },
  });
}

export async function createSchool(schoolId: number): Promise<string> {
  return createResource({
    endpoint: 'schools',
    role: 'host',
    body: {
      schoolId,
      nameOfInstitution: `New School ${schoolId}`,
      educationOrganizationCategories: [
        {
          educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other',
        },
      ],
      schoolCategories: [
        {
          schoolCategoryDescriptor: 'uri://ed-fi.org/SchoolCategoryDescriptor#All Levels',
        },
      ],
      gradeLevels: [
        {
          gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#First Grade',
        },
      ],
    },
  });
}

export async function createLocalEducationAgency(localEducationAgencyId: number): Promise<string> {
  return createResource({
    endpoint: 'localEducationAgencies',
    role: 'host',
    body: {
      localEducationAgencyId,
      nameOfInstitution: 'Grand Bend School District',
      localEducationAgencyCategoryDescriptor: 'uri://ed-fi.org/LocalEducationAgencyCategoryDescriptor#Independent',
      categories: [
        {
          educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other',
        },
      ],
    },
  });
}

export async function createStudent(studentUniqueId: string) {
  return createResource({
    endpoint: 'students',
    role: 'host',
    body: {
      studentUniqueId,
      birthDate: '2010-01-01',
      firstName: 'Automation',
      lastSurname: 'Student',
    },
  });
}

export async function createCourse(courseCode: string, educationOrganizationId: number) {
  await createResource({
    endpoint: 'CourseIdentificationSystemDescriptors',
    role: 'host',
    body: {
      codeValue: 'LEA course code',
      shortDescription: 'LEA course code',
      description: 'LEA course code',
      namespace: 'uri://ed-fi.org/CourseIdentificationSystemDescriptor',
    },
  });

  return createResource({
    endpoint: 'courses',
    role: 'host',
    body: {
      courseCode,
      educationOrganizationReference: {
        educationOrganizationId,
      },
      courseTitle: 'courseTitle',
      numberOfParts: 1,
      identificationCodes: [
        {
          courseIdentificationSystemDescriptor: 'uri://ed-fi.org/CourseIdentificationSystemDescriptor#LEA course code',
          courseCatalogURL: 'http://www.GBISD.edu/coursecatalog',
          identificationCode: 'ALG-1',
        },
      ],
    },
  });
}

export async function createSession(schoolId: number, schoolYear: number, sessionName: string) {
  await createResource({
    endpoint: 'TermDescriptors',
    role: 'host',
    body: {
      codeValue: 'Spring',
      shortDescription: 'Spring',
      description: 'Spring',
      namespace: 'uri://ed-fi.org/TermDescriptor',
    },
  });

  return createResource({
    endpoint: 'sessions',
    role: 'host',
    body: {
      schoolReference: {
        schoolId,
      },
      schoolYearTypeReference: {
        schoolYear,
      },
      sessionName,
      beginDate: '1900-01-01',
      endDate: '1900-05-01',
      termDescriptor: 'uri://ed-fi.org/TermDescriptor#Spring',
      totalInstructionalDays: 200,
    },
  });
}

export async function createCourseOffering(
  localCourseCode: string,
  courseCode: string,
  schoolId: number,
  schoolYear: number,
  sessionName: string,
) {
  return createResource({
    endpoint: 'courseOfferings',
    role: 'host',
    body: {
      localCourseCode,
      courseReference: {
        courseCode,
        educationOrganizationId: schoolId,
      },
      schoolReference: {
        schoolId,
      },
      sessionReference: {
        schoolId,
        schoolYear,
        sessionName,
      },
    },
  });
}

export async function createSection(
  localCourseCode: string,
  schoolId: number,
  schoolYear: number,
  sessionName: string,
  sectionIdentifier: string,
) {
  return createResource({
    endpoint: 'sections',
    role: 'host',
    body: {
      sectionIdentifier,
      courseOfferingReference: {
        localCourseCode,
        schoolId,
        schoolYear,
        sessionName,
      },
    },
  });
}

export async function createStudentSectionAssociation(
  localCourseCode: string,
  schoolId: number,
  schoolYear: number,
  sessionName: string,
  sectionIdentifier: string,
  studentUniqueId: string,
) {
  return createResource({
    endpoint: 'studentSectionAssociations',
    role: 'host',
    body: {
      beginDate: '2023-01-16',
      sectionReference: {
        localCourseCode,
        schoolId,
        schoolYear,
        sessionName,
        sectionIdentifier,
      },
      studentReference: {
        studentUniqueId,
      },
    },
  });
}

export async function createStudentEdOrgAssociation(studentUniqueId: string, schoolId: number) {
  await createResource({
    endpoint: 'SexDescriptors',
    role: 'host',
    body: {
      codeValue: 'NotSelected',
      shortDescription: 'Not Selected',
      description: 'Not Selected',
      namespace: 'uri://ed-fi.org/SexDescriptor#NotSelected',
    },
  });

  await createResource({
    endpoint: 'CohortYearTypeDescriptors',
    role: 'host',
    body: {
      codeValue: 'Twelfth grade',
      shortDescription: 'Twelfth grade',
      description: 'Twelfth grade',
      namespace: 'uri://ed-fi.org/CohortYearTypeDescriptor#Twelfth grade',
    },
  });

  return createResource({
    endpoint: 'StudentEducationOrganizationAssociations',
    role: 'host',
    body: {
      educationOrganizationReference: {
        educationOrganizationId: schoolId,
      },
      studentReference: {
        studentUniqueId,
      },
      sexDescriptor: 'uri://ed-fi.org/SexDescriptor#Female',
      cohortYears: [
        {
          schoolYearTypeReference: { schoolYear: 2022 },
          cohortYearTypeDescriptor: 'uri://ed-fi.org/CohortYearTypeDescriptor#Twelfth grade',
        },
      ],
    },
  });
}

export async function createProgram(programId: string, schoolId: number) {
  return createResource({
    endpoint: 'Programs',
    role: 'host',
    body: {
      educationOrganizationReference: {
        educationOrganizationId: schoolId,
      },
      programName: 'Gifted and Talented',
      programTypeDescriptor: 'uri://ed-fi.org/ProgramTypeDescriptor#Athletics',
      programId,
    },
  });
}

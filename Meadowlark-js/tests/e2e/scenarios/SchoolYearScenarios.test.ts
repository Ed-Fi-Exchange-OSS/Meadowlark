// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  createCourse,
  createCourseOffering,
  createSchool,
  createSection,
  createSession,
  createStudent,
  createStudentEdOrgAssociation,
  createStudentSectionAssociation,
} from '../helpers/DataCreation';
import { deleteResourceByLocation } from '../helpers/Resources';
import { generateRandomId } from '../helpers/Shared';

describe('When posting a resource that contains a SchoolYear enumeration', () => {
  jest.setTimeout(10000);

  /*
    There are several different ways of representing school years. Sometimes testing one way of storing it requires saving
    another "upstream" reference that also has a schoolYear. Thus if one wants to test a courseOffering, then one must upload
    a Session. Once a Session is created, one can create a CourseOffering. Instead of creating a stand-alone test for
    CourseOffering, which would require a Session to be created in the Arrange phase of the test, simply create one big test
    scenario that is a chain of successive Posts.
    */

  describe('given a chain of resources Session -> CourseOffering -> Section -> StudentSectionAssociation', () => {
    const schoolId = 120;
    const courseCode = '03100500';
    const schoolYear = 2022;
    const studentUniqueId = generateRandomId();
    const sessionName = '2021-2022 Spring Semester';
    const localCourseCode = 'local-101';
    const sectionIdentifier = 'L0CA1';

    const locations: string[] = [];

    afterAll(async () => {
      for (let i = 0; i < locations.length; i += 1) {
        await deleteResourceByLocation(locations[i]);
      }
    });

    it('each item is accepted', async () => {
      locations.push(await createStudent(studentUniqueId));
      locations.push(await createSchool(schoolId));
      locations.push(await createCourse(courseCode, schoolId));
      locations.push(await createSession(schoolId, schoolYear, sessionName));
      locations.push(await createCourseOffering(localCourseCode, courseCode, schoolId, schoolYear, sessionName));
      locations.push(await createSection(localCourseCode, schoolId, schoolYear, sessionName, sectionIdentifier));
      locations.push(
        await createStudentSectionAssociation(
          localCourseCode,
          schoolId,
          schoolYear,
          sessionName,
          sectionIdentifier,
          studentUniqueId,
        ),
      );
    });
  });

  describe('given a StudentEducationOrganizationAssociation with CohortYears', () => {
    const schoolId = 120;
    const studentUniqueId = generateRandomId();

    const locations: string[] = [];

    afterAll(async () => {
      for (let i = 0; i < locations.length; i += 1) {
        await deleteResourceByLocation(locations[i]);
      }
    });

    it('each item is accepted', async () => {
      locations.push(await createStudent(studentUniqueId));
      locations.push(await createSchool(schoolId));
      locations.push(await createStudentEdOrgAssociation(studentUniqueId, schoolId));
    });
  });
});

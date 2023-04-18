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

    /* DO NOT REORDER THESE TESTS!

       1. student
       2. School
       3. StudentEducationOrganizationAssociation

      The larger numbers are dependent on the earlier steps succeeding. Relying on Jest's documented behavior:
      https://jestjs.io/docs/setup-teardown#order-of-execution-of-describe-and-test-blocks

      > Once the describe blocks are complete, by default Jest runs all the tests serially in the order they were encountered
      > in the collection phase, waiting for each to finish and be tidied up before moving on.

      We simply need to accept that a failure on the student will cause "downstream" failures as well.
    */

    it('creates a student successfully', async () => {
      locations.push(await createStudent(studentUniqueId));
    });

    it('creates a school successfully', async () => {
      locations.push(await createSchool(schoolId));
    });

    it('creates a studentEducationOrganizationAssociation successfully', async () => {
      locations.push(await createStudentEdOrgAssociation(studentUniqueId, schoolId));
    });
  });
});

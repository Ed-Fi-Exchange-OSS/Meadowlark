// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createLocalEducationAgency, createProgram, createSchool, createStudent } from '../helpers/DataCreation';
import { deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, generateRandomId, rootURLRequest } from '../helpers/Shared';

jest.setTimeout(40000);

describe('Given the existance of a student, a school, a local education agency and a program', () => {
  const schoolId = 100;
  const localEducationAgencyId = 101;
  const studentUniqueId = generateRandomId();
  const programId = generateRandomId();

  const schoolStudentProgramAssociationBody = {
    educationOrganizationReference: {
      educationOrganizationId: schoolId,
    },
    programReference: {
      educationOrganizationId: schoolId,
      programName: 'Gifted and Talented',
      programTypeDescriptor: 'uri://ed-fi.org/ProgramTypeDescriptor#Athletics',
    },
    studentReference: {
      studentUniqueId,
    },
    beginDate: '2010-08-30',
    endDate: '2010-12-17',
    reasonExitedDescriptor: 'uri://ed-fi.org/ReasonExitedDescriptor#Moved out of state',
  };

  const leaStudentProgramAssociationBody = {
    educationOrganizationReference: {
      educationOrganizationId: localEducationAgencyId,
    },
    programReference: {
      educationOrganizationId: localEducationAgencyId,
      programName: 'Gifted and Talented',
      programTypeDescriptor: 'uri://ed-fi.org/ProgramTypeDescriptor#Athletics',
    },
    studentReference: {
      studentUniqueId,
    },
    beginDate: '2010-08-30',
    endDate: '2010-12-17',
    reasonExitedDescriptor: 'uri://ed-fi.org/ReasonExitedDescriptor#Moved out of state',
  };

  let localEducationAgencyLocation: string;
  let schoolLocation: string;
  let studentLocation: string;
  let programLocation: string;
  let studentProgramAssociationSchoolLocation: string;
  let studentProgramAssociationLEALocation: string;

  beforeAll(async () => {
    schoolLocation = await createSchool(schoolId);
    localEducationAgencyLocation = await createLocalEducationAgency(localEducationAgencyId);
    studentLocation = await createStudent(studentUniqueId);
    programLocation = await createProgram(programId, schoolId);
  });

  afterAll(async () => {
    await deleteResourceByLocation(studentProgramAssociationSchoolLocation);
    await deleteResourceByLocation(studentProgramAssociationLEALocation);

    await deleteResourceByLocation(programLocation);
    await deleteResourceByLocation(studentLocation);
    await deleteResourceByLocation(schoolLocation);
    await deleteResourceByLocation(localEducationAgencyLocation);
  });

  describe('when it associates the student and the program to a school education organization', () => {
    it('returns success', async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/studentProgramAssociations')
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(schoolStudentProgramAssociationBody)
        .expect(201)
        .then((response) => {
          studentProgramAssociationSchoolLocation = response.headers.location;
        });
    });

    it('returns the student program association on get', async () => {
      await rootURLRequest()
        .get(studentProgramAssociationSchoolLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(schoolStudentProgramAssociationBody));
        });
    });
  });

  describe('when it associates the student and the program to a local education agency education organization', () => {
    it('returns success', async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/studentProgramAssociations')
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(leaStudentProgramAssociationBody)
        .expect(201)
        .then((response) => {
          studentProgramAssociationLEALocation = response.headers.location;
        });
    });

    it('returns the student program association on get', async () => {
      await rootURLRequest()
        .get(studentProgramAssociationLEALocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(leaStudentProgramAssociationBody));
        });
    });
  });

  describe('when it tries to update an student program association with a different education organization', () => {
    it('returns error', async () => {
      await rootURLRequest()
        .put(studentProgramAssociationSchoolLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send({
          educationOrganizationReference: {
            educationOrganizationId: localEducationAgencyId,
          },
          programReference: {
            educationOrganizationId: schoolId,
            programName: 'Gifted and Talented',
            programTypeDescriptor: 'uri://ed-fi.org/ProgramTypeDescriptor#Athletics',
          },
          studentReference: {
            studentUniqueId,
          },
          beginDate: '2010-08-30',
          endDate: '2010-12-17',
          reasonExitedDescriptor: 'uri://ed-fi.org/ReasonExitedDescriptor#Moved out of state',
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "The identity of the resource does not match the identity in the updated document.",
            }
          `);
        });
    });
  });

  describe('when it tries to delete an education organization that is part of an association', () => {
    it('returns error', async () => {
      await rootURLRequest()
        .delete(localEducationAgencyLocation)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(403);
    });

    it('returns the student program association on get', async () => {
      await rootURLRequest()
        .get(studentProgramAssociationLEALocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(leaStudentProgramAssociationBody));
        });
    });
  });
});
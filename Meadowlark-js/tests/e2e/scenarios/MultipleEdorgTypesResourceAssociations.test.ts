// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createLocalEducationAgency, createProgram, createSchool, createStudent } from '../helpers/DataCreation';
import { deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, generateRandomId, rootURLRequest } from '../helpers/Shared';

describe('Given the existence of a student, a school, a local education agency and a program', () => {
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

  beforeAll(async () => {
    schoolLocation = await createSchool(schoolId);
    localEducationAgencyLocation = await createLocalEducationAgency(localEducationAgencyId);
    studentLocation = await createStudent(studentUniqueId);
    programLocation = await createProgram(programId, schoolId);
  });

  afterAll(async () => {
    await deleteResourceByLocation(programLocation, 'program');
    await deleteResourceByLocation(studentLocation, 'student');
    await deleteResourceByLocation(schoolLocation, 'school');
    await deleteResourceByLocation(localEducationAgencyLocation, 'localEducationAgency');
  });

  describe('when it associates the student and the program to a school education organization', () => {
    let studentProgramAssociationLocation: string;

    it('returns success', async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/studentProgramAssociations')
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(schoolStudentProgramAssociationBody)
        .expect(201)
        .then((response) => {
          studentProgramAssociationLocation = response.headers.location;
        });
    });

    it('returns the student program association on get', async () => {
      await rootURLRequest()
        .get(studentProgramAssociationLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(schoolStudentProgramAssociationBody));
        });
    });

    afterAll(async () => {
      await deleteResourceByLocation(studentProgramAssociationLocation, 'studentProgramAssociation');
    });
  });

  describe('when it associates the student and the program to a local education agency education organization', () => {
    let studentProgramAssociationLocation: string;

    it('returns success', async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/studentProgramAssociations')
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(leaStudentProgramAssociationBody)
        .expect(201)
        .then((response) => {
          studentProgramAssociationLocation = response.headers.location;
        });
    });

    it('returns the student program association on get', async () => {
      await rootURLRequest()
        .get(studentProgramAssociationLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(leaStudentProgramAssociationBody));
        });
    });

    afterAll(async () => {
      await deleteResourceByLocation(studentProgramAssociationLocation, 'studentProgramAssociation');
    });
  });

  describe('when it tries to update an student program association with a different education organization', () => {
    let studentProgramAssociationLocation: string;

    beforeAll(async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/studentProgramAssociations')
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(schoolStudentProgramAssociationBody)
        .expect(201)
        .then((response) => {
          studentProgramAssociationLocation = response.headers.location;
        });
    });

    afterAll(async () => {
      await deleteResourceByLocation(studentProgramAssociationLocation, 'studentProgramAssociation');
    });

    it('returns error', async () => {
      const id = await rootURLRequest()
        .get(studentProgramAssociationLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .then((response) => response.body.id);
      await rootURLRequest()
        .put(studentProgramAssociationLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send({
          id,
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
              "error": {
                "message": "The identity fields of the document cannot be modified",
              },
            }
          `);
        });
    });
  });

  describe('when it tries to delete an education organization that is part of an association', () => {
    let studentProgramAssociationLocation: string;
    beforeAll(async () => {
      await baseURLRequest()
        .post('/v3.3b/ed-fi/studentProgramAssociations')
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(leaStudentProgramAssociationBody)
        .expect(201)
        .then((response) => {
          studentProgramAssociationLocation = response.headers.location;
        });
    });

    afterAll(async () => {
      await deleteResourceByLocation(studentProgramAssociationLocation, 'studentProgramAssociation');
    });

    it('returns error', async () => {
      await rootURLRequest()
        .delete(localEducationAgencyLocation)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(403);
    });

    it('returns the student program association on get', async () => {
      await rootURLRequest()
        .get(studentProgramAssociationLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(leaStudentProgramAssociationBody));
        });
    });
  });
});

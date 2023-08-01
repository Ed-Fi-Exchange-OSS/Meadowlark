// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createGradeLevelDescriptor, createSchool, createStudent } from '../helpers/DataCreation';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, generateRandomId, getDescriptorByLocation } from '../helpers/Shared';

describe('When querying for a resource that has multiple references to resources', () => {
  describe('given a token with strict validation', () => {
    describe('given resources do not exist', () => {
      it('should return empty results', async () => {
        await baseURLRequest()
          .get('/v3.3b/ed-fi/studentSchoolAssociations')
          .auth(await getAccessToken('vendor'), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual([]);
          });
      });
    });

    describe('given references exist', () => {
      let studentUniqueId: string;
      let studentLocation: string;
      let schoolLocation: string;
      let schoolId: number;
      let studentAssociationLocation: string;
      let entryGradeLevelDescriptor: string;
      let entryGradeLevelDescriptorLocation: string;
      beforeAll(async () => {
        studentUniqueId = generateRandomId();

        entryGradeLevelDescriptorLocation = await createGradeLevelDescriptor();
        entryGradeLevelDescriptor = await getDescriptorByLocation(entryGradeLevelDescriptorLocation);

        studentLocation = await createStudent(studentUniqueId);
        schoolId = 100;
        schoolLocation = await createSchool(120);
        studentAssociationLocation = await createResource({
          endpoint: 'studentSchoolAssociations',
          role: 'host',
          body: {
            schoolReference: {
              schoolId,
            },
            studentReference: {
              studentUniqueId,
            },
            entryDate: '2010-01-01',
            entryGradeLevelDescriptor,
          },
        });
      });

      afterAll(async () => {
        await deleteResourceByLocation(studentLocation, 'student');
        await deleteResourceByLocation(studentAssociationLocation, 'studentAssociation');
        await deleteResourceByLocation(schoolLocation, 'school');
        await deleteResourceByLocation(entryGradeLevelDescriptorLocation, 'entryGradeLevelDescriptor');
      });

      describe('when querying all results', () => {
        it('should return all data', async () => {
          await baseURLRequest()
            .get(`/v3.3b/ed-fi/studentSchoolAssociations`)
            .auth(await getAccessToken('host'), { type: 'bearer' })
            .expect(200)
            .then((response) => {
              expect(response.body).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    entryDate: '2010-01-01',
                    entryGradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Eight Grade',
                    id: expect.any(String),
                    schoolReference: {
                      schoolId,
                    },
                    studentReference: {
                      studentUniqueId,
                    },
                  }),
                ]),
              );
            });
        });
      });
    });
  });
});

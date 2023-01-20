// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { baseURLRequest } from '../helpers/Shared';

describe('When creating a resource', () => {
  describe('given a descriptor name ', () => {
    it('should fail with message about the missing property', async () => {
      // This is entirely missing the "categories" collection
      await baseURLRequest()
        .post('/v3.3b/ed-fi/learningObjectives')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          learningObjectiveId: '0z41dmrtgsm4wqbwv3k0v5vkbdurrgeu',
          namespace: 'uri://ed-fi.org',
          description:
            'The student will demonstrate the ability to utilize numbers to perform operations with complex concepts at a high level.',
          objective: 'Number Operations and Concepts PACZ',
          academicSubjects: [
            {
              academicSubjectDescriptor: 'uri://ed-fi.org/AcademicSubjectDescriptor#Composite',
            },
          ],
          gradeLevels: [
            {
              gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Sixth grade',
            },
          ],
          learningStandards: [],
        })
        .expect(200);
    });
  });
});

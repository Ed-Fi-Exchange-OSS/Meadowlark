// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { createAcademicSubjectDescriptor, createGradeLevelDescriptor } from '../helpers/DataCreation';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';

describe('When mapping a resource that meets requirements for prefix removal', () => {
  let gradeLevelDescriptorLocation: string;
  let academicSubjectDescriptorLocation: string;
  let learningObjectiveLocation: string;

  beforeAll(async () => {
    gradeLevelDescriptorLocation = await createGradeLevelDescriptor();
    academicSubjectDescriptorLocation = await createAcademicSubjectDescriptor();
  });

  afterAll(async () => {
    await deleteResourceByLocation(learningObjectiveLocation, 'learningObjective');
    await deleteResourceByLocation(gradeLevelDescriptorLocation, 'gradeLevelDescriptor');
    await deleteResourceByLocation(academicSubjectDescriptorLocation, 'academicSubjectDescriptor');
  });

  describe('given a LearningObjective entity with GradeLevel descriptor with role name Objective', () => {
    // LearningObjective has a GradeLevel descriptor collection with a role name of Objective, thus the full name of
    // the collection is objectiveGradeLevels. That would make the property learningObjective.objectiveGradeLevels in the ODS
    // this becomes learningObjectives.gradeLevels.
    it('should trim the extra "objective" prefix', async () => {
      learningObjectiveLocation = await createResource({
        endpoint: 'learningObjectives',
        role: 'host',
        body: {
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
              gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Eight Grade',
            },
          ],
          learningStandards: [],
        },
      });
    });
  });
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  baseURLRequest,
  getAccessToken,
  Clients,
  deleteByLocation,
  rootURLRequest,
  createResource,
} from './SharedFunctions';

describe('Student Intervention Association', () => {
  describe('with strict validation', () => {
    it('should fail when missing data', async () => {
      await baseURLRequest
        .post('/v3.3b/ed-fi/StudentInterventionAssociations')
        .auth(await getAccessToken(Clients.Vendor1), { type: 'bearer' })
        .send({
          studentReference: {
            studentUniqueId: 's0zf6d1123d3e',
          },
          interventionReference: {
            interventionIdentificationCode: '111',
            educationOrganizationId: 123,
          },
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('Resource Intervention is missing identity');
          expect(response.body.message).toContain('Resource Student is missing identity');
        });
    });
  });

  describe('without strict validation', () => {
    let location: string;

    it('should add the association', async () => {
      location = await createResource({
        endpoint: 'StudentInterventionAssociations',
        credentials: Clients.Assessment1,
        body: {
          studentReference: {
            studentUniqueId: 's0zf6d1123d3e',
          },
          interventionReference: {
            interventionIdentificationCode: '111',
            educationOrganizationId: 123,
          },
        },
      });

      await rootURLRequest
        .get(location)
        .auth(await getAccessToken(Clients.Assessment1), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              studentReference: {
                studentUniqueId: 's0zf6d1123d3e',
              },
            }),
          );
        });
    });

    afterAll(async () => {
      await deleteByLocation(location);
    });
  });
});

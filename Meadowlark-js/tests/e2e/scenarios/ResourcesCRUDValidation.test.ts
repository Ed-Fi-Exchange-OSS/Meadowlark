// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Response } from 'supertest';
import { getAccessToken } from '../helpers/Credentials';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';
import { createContentClassDescriptor } from '../helpers/DataCreation';
import { deleteResourceByLocation, getResourceByLocation } from '../helpers/Resources';

describe('when performing crud operations', () => {
  const resource = 'contentClassDescriptors';
  const resourceEndpoint = `/v3.3b/ed-fi/${resource}`;
  const resourceBody = {
    codeValue: 'Presentation',
    description: 'Presentation',
    shortDescription: 'Presentation',
    namespace: 'uri://ed-fi.org/ContentClassDescriptor',
  };
  const resourceBodyUpdated = {
    codeValue: 'Presentation',
    description: 'Presentation+',
    shortDescription: 'Presentation',
    namespace: 'uri://ed-fi.org/ContentClassDescriptor',
  };

  describe('when creating a new resource with empty body', () => {
    it('returns 400', async () => {
      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send({})
        .expect(400);
    });
  });

  describe('when creating a new resource', () => {
    let createdResourceLocation: string;
    beforeAll(async () => {
      createdResourceLocation = await createContentClassDescriptor();
    });

    afterAll(async () => {
      await deleteResourceByLocation(createdResourceLocation);
    });

    it('is created', () => {
      expect(createdResourceLocation).toBeTruthy();
    });
  });

  describe('when getting a resource by ID that does not exist', () => {
    it('returns 404', async () => {
      const randomUuid: string = '274fa5ec-fb0b-4759-b0dc-f2858703f1a3';
      const response = await getResourceByLocation(randomUuid);
      expect(response.statusCode).toEqual(404);
    });
  });

  describe('when getting a resource by ID', () => {
    describe('given the resource exists', () => {
      let createdResourceLocation: string;
      let getResponse: Response;

      beforeAll(async () => {
        createdResourceLocation = await createContentClassDescriptor();

        getResponse = await getResourceByLocation(createdResourceLocation);
      });

      afterAll(async () => {
        await deleteResourceByLocation(createdResourceLocation);
      });

      it('returns 200', () => {
        expect(getResponse.statusCode).toEqual(200);
      });

      it('returns its body successfully.', () => {
        expect(getResponse.body).toEqual(expect.objectContaining(resourceBody));
      });

      it('should match the location', async () => {
        const id = await getResourceByLocation(createdResourceLocation).then((response) => response.body.id);

        const response = await baseURLRequest()
          .get(`${resourceEndpoint}/${id}`)
          .auth(await getAccessToken('host'), { type: 'bearer' });
        expect(response.statusCode).toEqual(200);

        expect(createdResourceLocation).toContain(`${resourceEndpoint}/${id}`);
      });
    });
  });

  describe('when getting all resources', () => {
    let createdResourceLocation: string;
    let getAllResponse: Response;

    beforeAll(async () => {
      createdResourceLocation = await createContentClassDescriptor();

      getAllResponse = await baseURLRequest()
        .get(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });

    afterAll(async () => {
      await deleteResourceByLocation(createdResourceLocation);
    });

    it('returns 200', () => {
      expect(getAllResponse.statusCode).toEqual(200);
    });

    it('returns one resource', async () => {
      expect(getAllResponse.body).toEqual(expect.arrayContaining([expect.objectContaining(resourceBody)]));
    });
  });

  describe('when upserting a resource', () => {
    let createdResourceLocation: string;
    let upsertResponse: Response;

    beforeAll(async () => {
      createdResourceLocation = await createContentClassDescriptor();

      upsertResponse = await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyUpdated);
    });

    afterAll(async () => {
      await deleteResourceByLocation(createdResourceLocation);
    });

    it('returns 200', () => {
      expect(upsertResponse.statusCode).toEqual(200);
    });

    it('returns updated resource on get', async () => {
      await getResourceByLocation(upsertResponse.headers.location).then((updatedResponse) => {
        expect(updatedResponse.body).toEqual(expect.objectContaining(resourceBodyUpdated));
      });
    });
  });

  describe('when updating a resource', () => {
    let createdResourceLocation: string;

    beforeAll(async () => {
      createdResourceLocation = await createContentClassDescriptor();

      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyUpdated);
    });

    afterAll(async () => {
      await deleteResourceByLocation(createdResourceLocation);
    });

    describe('when updating a resource with empty body', () => {
      it('returns 400', async () => {
        await rootURLRequest()
          .put(createdResourceLocation)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .send({})
          .expect(400);
      });
    });

    it('returns 204', async () => {
      const id = await getResourceByLocation(createdResourceLocation).then((response) => response.body.id);

      await rootURLRequest()
        .put(createdResourceLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send({
          id,
          ...resourceBody,
        })
        .expect(204);
    });

    it('should fail when resource ID is different in body on put', async () => {
      const id = 'differentId';
      await rootURLRequest()
        .put(createdResourceLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send({
          id,
          ...resourceBody,
        })
        .expect(400)
        .then((response) => {
          expect(response.body.error).toMatchInlineSnapshot(`
            {
              "message": "The identity of the resource does not match the identity in the updated document.",
            }
          `);
        });
    });

    it('should fail when resource ID is not included in body on put', async () => {
      await rootURLRequest()
        .put(createdResourceLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody)
        .expect(400)
        .then((response) => {
          expect(response.body.error).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "required",
                },
                "message": "{requestBody} must have required property 'id'",
                "path": "{requestBody}",
              },
            ]
          `);
        });
    });

    it('returns updated resource on get', async () => {
      await getResourceByLocation(createdResourceLocation).then((response) => {
        expect(response.body).toEqual(expect.objectContaining(resourceBody));
      });
    });

    it('should fail when resource ID is included in body on post', async () => {
      const id = await getResourceByLocation(createdResourceLocation).then((response) => response.body.id);

      await baseURLRequest()
        .post(`${resourceEndpoint}`)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send({
          id,
          ...resourceBodyUpdated,
        })
        .expect(400)
        .then((response) => {
          expect(response.body.error).toMatchInlineSnapshot(`
            [
              {
                "context": {
                  "errorType": "additionalProperties",
                },
                "message": "'id' property is not expected to be here",
                "path": "{requestBody}",
              },
            ]
          `);
        });
    });
  });

  describe('when deleting a resource', () => {
    let createdResourceLocation: string;
    let deleteResponse: Response;
    beforeAll(async () => {
      createdResourceLocation = await createContentClassDescriptor();

      deleteResponse = await rootURLRequest()
        .delete(createdResourceLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });

    it('returns 404 when deleting a resource that does not exist', async () => {
      await rootURLRequest()
        .delete(`${createdResourceLocation.slice(0, -1)}F`)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(404);
    });

    it('returns 204', () => {
      expect(deleteResponse.statusCode).toEqual(204);
    });

    it('returns 404 on get', async () => {
      const response = await getResourceByLocation(createdResourceLocation);
      expect(response.statusCode).toEqual(404);
    });
  });
});

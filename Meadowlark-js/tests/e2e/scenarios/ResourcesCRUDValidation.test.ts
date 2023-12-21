import { Response } from 'supertest';
import { getAccessToken } from '../helpers/Credentials';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

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
    let response: Response;
    beforeAll(async () => {
      response = await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);
    });

    afterAll(async () => {
      await rootURLRequest()
        .delete(response.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);
    });

    it('returns 201', () => {
      expect(response.statusCode).toBe(201);
    });
  });

  describe('when getting a resource by ID', () => {
    describe('given the resource exists', () => {
      let createResponse: Response;
      let getResponse: Response;

      beforeAll(async () => {
        createResponse = await baseURLRequest()
          .post(resourceEndpoint)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .send(resourceBody);

        getResponse = await rootURLRequest()
          .get(createResponse.headers.location)
          .auth(await getAccessToken('host'), { type: 'bearer' });
      });

      afterAll(async () => {
        await rootURLRequest()
          .delete(createResponse.headers.location)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .send(resourceBody);
      });

      it('returns 200', () => {
        expect(getResponse.statusCode).toEqual(200);
      });

      it('returns its body successfully.', () => {
        expect(getResponse.body).toEqual(expect.objectContaining(resourceBody));
      });

      it('returns 404 when the resource does not exist', async () => {
        await rootURLRequest()
          .get(`${createResponse.headers.location.slice(0, -1)}F`)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .expect(404);
      });

      it('should match the location', async () => {
        const id = await rootURLRequest()
          .get(createResponse.headers.location)
          .auth(await getAccessToken('vendor'), { type: 'bearer' })
          .then((response) => response.body.id);

        await baseURLRequest()
          .get(`${resourceEndpoint}/${id}`)
          .auth(await getAccessToken('vendor'), { type: 'bearer' })
          .expect(200);

        expect(createResponse.headers.location).toContain(`${resourceEndpoint}/${id}`);
      });
    });
  });

  describe('when getting all resources', () => {
    let createResponse: Response;
    let getAllResponse: Response;

    beforeAll(async () => {
      createResponse = await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);

      getAllResponse = await baseURLRequest()
        .get(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });

    afterAll(async () => {
      await rootURLRequest()
        .delete(createResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);
    });

    it('returns 200', () => {
      expect(getAllResponse.statusCode).toEqual(200);
    });

    it('returns one resource', async () => {
      expect(getAllResponse.body).toEqual(expect.arrayContaining([expect.objectContaining(resourceBody)]));
    });
  });

  describe('when upserting a resource', () => {
    let insertResponse: Response;
    let upsertResponse: Response;

    beforeAll(async () => {
      insertResponse = await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);

      upsertResponse = await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyUpdated);
    });

    afterAll(async () => {
      await rootURLRequest()
        .delete(insertResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);
    });

    it('returns 200', () => {
      expect(upsertResponse.statusCode).toEqual(200);
    });

    it('returns updated resource on get', async () => {
      await rootURLRequest()
        .get(upsertResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .then((updatedResponse) => {
          expect(updatedResponse.body).toEqual(expect.objectContaining(resourceBodyUpdated));
        });
    });
  });

  describe('when updating a resource', () => {
    let insertResponse: Response;

    beforeAll(async () => {
      insertResponse = await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);

      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyUpdated);
    });

    afterAll(async () => {
      await rootURLRequest()
        .delete(insertResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);
    });

    describe('when updating a resource with empty body', () => {
      it('returns 400', async () => {
        await rootURLRequest()
          .put(insertResponse.headers.location)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .send({})
          .expect(400);
      });
    });

    it('returns 204', async () => {
      const id = await rootURLRequest()
        .get(insertResponse.headers.location)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .then((response) => response.body.id);

      await rootURLRequest()
        .put(insertResponse.headers.location)
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
        .put(insertResponse.headers.location)
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
        .put(insertResponse.headers.location)
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
      await rootURLRequest()
        .get(insertResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(resourceBody));
        });
    });

    it('should fail when resource ID is included in body on post', async () => {
      const id = await rootURLRequest()
        .get(insertResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .then((response) => response.body.id);
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
    let createResponse: Response;
    let deleteResponse: Response;
    beforeAll(async () => {
      createResponse = await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);

      deleteResponse = await rootURLRequest()
        .delete(createResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody);
    });

    it('returns 404 when deleting a resource that does not exist', async () => {
      await rootURLRequest()
        .delete(`${createResponse.headers.location.slice(0, -1)}F`)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody)
        .expect(404);
    });

    it('returns 204', () => {
      expect(deleteResponse.statusCode).toEqual(204);
    });

    it('returns 404 on get', async () => {
      await rootURLRequest()
        .get(createResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(404);
    });
  });
});

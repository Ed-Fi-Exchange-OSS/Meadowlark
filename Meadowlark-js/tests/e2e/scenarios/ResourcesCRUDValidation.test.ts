import { getAccessToken } from '../helpers/Credentials';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('when performing crud operations', () => {
  let resourceResponse;
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
    beforeAll(async () => {
      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody)
        .then((response) => {
          resourceResponse = response;
        });
    });

    it('returns 201', () => {
      expect(resourceResponse.statusCode).toBe(201);
    });
  });

  describe('when getting a resource by ID', () => {
    describe('given the resource exists', () => {
      let getResponse;
      it('returns 200', async () => {
        await rootURLRequest()
          .get(resourceResponse.headers.location)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .expect(200)
          .then((response) => {
            getResponse = response;
          });
      });

      it('returns its body successfully.', () => {
        expect(getResponse.body).toEqual(expect.objectContaining(resourceBody));
      });
    });

    describe('given the resource does not exist', () => {
      it('returns 404', async () => {
        await rootURLRequest()
          .get(`${resourceResponse.headers.location.slice(0, -1)}F`)
          .auth(await getAccessToken('host'), { type: 'bearer' })
          .expect(404);
      });
    });

    it('should match the location', async () => {
      const id = await rootURLRequest()
        .get(resourceResponse.headers.location)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .then((response) => response.body.id);

      await baseURLRequest()
        .get(`${resourceEndpoint}/${id}`)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .expect(200);

      expect(resourceResponse.headers.location).toContain(`${resourceEndpoint}/${id}`);
    });
  });

  describe('when getting all resources', () => {
    let getAllResponse;
    it('returns 200', async () => {
      await baseURLRequest()
        .get(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          getAllResponse = response;
        });
    });

    it('returns one resource', async () => {
      expect(getAllResponse.body).toEqual(expect.arrayContaining([expect.objectContaining(resourceBody)]));
    });
  });

  describe('when upserting a resource', () => {
    it('returns 200', async () => {
      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyUpdated)
        .expect(200);
    });

    it('returns updated resource on get', async () => {
      await rootURLRequest()
        .get(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(resourceBodyUpdated));
        });
    });
  });

  describe('when updating a resource with empty body', () => {
    it('returns 400', async () => {
      await rootURLRequest()
        .put(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send({})
        .expect(400);
    });
  });

  describe('when updating a resource', () => {
    it('returns 204', async () => {
      const id = await rootURLRequest()
        .get(resourceResponse.headers.location)
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .then((response) => response.body.id);

      await rootURLRequest()
        .put(resourceResponse.headers.location)
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
        .put(resourceResponse.headers.location)
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
        .put(resourceResponse.headers.location)
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
        .get(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(resourceBody));
        });
    });

    it('should fail when resource ID is included in body on post', async () => {
      const id = await rootURLRequest()
        .get(resourceResponse.headers.location)
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

  describe('when deleting a resource that does not exist', () => {
    it('returns 404', async () => {
      await rootURLRequest()
        .delete(`${resourceResponse.headers.location.slice(0, -1)}F`)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody)
        .expect(404);
    });
  });

  describe('when deleting a resource', () => {
    it('returns 204', async () => {
      await rootURLRequest()
        .delete(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody)
        .expect(204);
    });

    it('returns 404 on get', async () => {
      await rootURLRequest()
        .get(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .expect(404);
    });
  });
});

import { Credentials, createClient, getAccessToken } from '../helpers/Credentials';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('given the existence of two vendors and one host', () => {
  let vendor1Data: Credentials = {
    clientName: 'Vendor 1',
    roles: ['vendor'],
  };
  let vendor2Data: Credentials = {
    clientName: 'Vendor 2',
    roles: ['vendor'],
  };
  let host1Data: Credentials = {
    clientName: 'host 1',
    roles: ['host'],
  };

  let vendor1DataAccessToken = '';
  let vendor2DataAccessToken = '';
  let host1DataAccessToken = '';

  let contentClassDescriptorLocation = '';

  let resourceLocation = '';
  const resourceEndpoint = 'EducationContents';
  const resourceBody = {
    contentIdentifier: '933zsd4350',
    namespace: '43210',
    shortDescription: 'abc',
    contentClassDescriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
    learningResourceMetadataURI: '21430',
  };

  beforeAll(async () => {
    vendor1Data = await createClient(vendor1Data);
    vendor2Data = await createClient(vendor2Data);
    host1Data = await createClient(host1Data);

    // Vendor 1
    await baseURLRequest()
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: vendor1Data.key,
        client_secret: vendor1Data.secret,
      })
      .expect(200)
      .then((response) => {
        vendor1DataAccessToken = response.body.access_token;
      });

    // Vendor 2
    await baseURLRequest()
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: vendor2Data.key,
        client_secret: vendor2Data.secret,
      })
      .expect(200)
      .then((response) => {
        vendor2DataAccessToken = response.body.access_token;
      });

    // Host 1
    await baseURLRequest()
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: host1Data.key,
        client_secret: host1Data.secret,
      })
      .expect(200)
      .then((response) => {
        host1DataAccessToken = response.body.access_token;
      });

    contentClassDescriptorLocation = await createResource({
      endpoint: 'contentClassDescriptors',
      body: {
        codeValue: 'Presentation',
        shortDescription: 'Presentation',
        description: 'Presentation',
        namespace: 'uri://ed-fi.org/ContentClassDescriptor',
      },
      accessToken: vendor1DataAccessToken,
    });

    expect(contentClassDescriptorLocation).toBeTruthy();
  });

  afterAll(async () => {
    await deleteResourceByLocation(contentClassDescriptorLocation, 'contentClassDescriptor');
  });

  // GET
  describe('given a vendor API client has created a resource', () => {
    beforeEach(async () => {
      await baseURLRequest()
        .post(`/v3.3b/ed-fi/${resourceEndpoint}`)
        .send(resourceBody)
        .auth(vendor1DataAccessToken, { type: 'bearer' })
        .expect(201)
        .then((response) => {
          expect(response).not.toBe('');
          resourceLocation = response.headers.location;
        });

      expect(resourceLocation).toBeTruthy();
    });

    describe('when the same vendor requests the resource', () => {
      it('should receive the resource', async () => {
        await rootURLRequest()
          .get(resourceLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.objectContaining(resourceBody));
          });
      });
    });

    describe('when the same vendor requests all resources', () => {
      it('should receive one resource', async () => {
        await baseURLRequest()
          .get(`/v3.3b/ed-fi/${resourceEndpoint}`)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(resourceBody)]));
          });
      });
    });

    describe('when a different vendor requests the resource', () => {
      it('should be denied', async () => {
        await rootURLRequest().get(resourceLocation).auth(vendor2DataAccessToken, { type: 'bearer' }).expect(403);
      });
    });

    describe('when a different vendor requests all resources', () => {
      it('should be denied', async () => {
        await rootURLRequest()
          .get(`/v3.3b/ed-fi/${resourceEndpoint}`)
          .auth(vendor2DataAccessToken, { type: 'bearer' })
          .expect(404);
      });
    });

    describe('when a host account requests the resource', () => {
      it('should receive the resource', async () => {
        await rootURLRequest().get(resourceLocation).auth(host1DataAccessToken, { type: 'bearer' }).expect(200);
      });
    });

    describe('when a host account requests all resources', () => {
      it('should receive one resource', async () => {
        await baseURLRequest()
          .get(`/v3.3b/ed-fi/${resourceEndpoint}`)
          .auth(host1DataAccessToken, { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(resourceBody)]));
          });
      });
    });

    // POST
    const resourceBodyPOSTUpdated = {
      contentIdentifier: '933zsd4350',
      namespace: '43210',
      shortDescription: 'abc_POST',
      contentClassDescriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
      learningResourceMetadataURI: '21430',
    };

    describe('when the same vendor upserts the resource', () => {
      it('should return upsert success', async () => {
        await rootURLRequest()
          .post(resourceLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .send(resourceBodyPOSTUpdated)
          .expect(200);
      });
    });

    describe('when a different vendor upserts the resource', () => {
      it('should return error', async () => {
        await rootURLRequest()
          .post(resourceLocation)
          .auth(vendor2DataAccessToken, { type: 'bearer' })
          .send(resourceBodyPOSTUpdated)
          .expect(403)
          .then((response) => {
            expect(response.body).toBe('');
          });
      });
    });

    describe('when a host account upserts the resource', () => {
      it('should return success', async () => {
        await rootURLRequest()
          .post(resourceLocation)
          .auth(host1DataAccessToken, { type: 'bearer' })
          .send(resourceBody)
          .expect(200);
      });
    });

    // PUT
    const resourceBodyPutUpdated = {
      contentIdentifier: '933zsd4350',
      namespace: '43210',
      shortDescription: 'abc_PUT',
      contentClassDescriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
      learningResourceMetadataURI: '21430',
    };

    describe('when the same vendor updates the resource', () => {
      it('should return success', async () => {
        const id = await rootURLRequest()
          .get(resourceLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .then((response) => response.body.id);
        await rootURLRequest()
          .put(resourceLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .send({
            id,
            ...resourceBodyPutUpdated,
          })
          .expect(204);
      });
    });

    describe('when a different vendor tries to insert an existing resource', () => {
      it('should return error', async () => {
        await rootURLRequest()
          .post(resourceLocation.slice(0, resourceLocation.lastIndexOf('/')))
          .auth(vendor2DataAccessToken, { type: 'bearer' })
          .send(resourceBodyPutUpdated)
          .expect(403)
          .then((response) => {
            expect(response.body).toBe('');
          });
      });
    });

    describe('when a different vendor updates the resource', () => {
      it('should return error', async () => {
        // Get resource id to update
        const id = await rootURLRequest()
          .get(resourceLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .then((response) => response.body.id);
        await rootURLRequest()
          .put(resourceLocation)
          .auth(vendor2DataAccessToken, { type: 'bearer' })
          .send({
            id,
            ...resourceBodyPutUpdated,
          })
          .expect(403)
          .then((response) => {
            expect(response.body).toBe('');
          });
      });
    });

    describe('when a host account requests the resource', () => {
      it('should return success', async () => {
        const id = await rootURLRequest()
          .get(resourceLocation)
          .auth(host1DataAccessToken, { type: 'bearer' })
          .then((response) => response.body.id);
        await rootURLRequest()
          .put(resourceLocation)
          .auth(host1DataAccessToken, { type: 'bearer' })
          .send({
            id,
            ...resourceBodyPutUpdated,
          })
          .expect(204);
      });
    });

    describe('when the same vendor deletes the resource', () => {
      it('should return success', async () => {
        await rootURLRequest().delete(resourceLocation).auth(vendor1DataAccessToken, { type: 'bearer' }).expect(204);
      });
    });

    describe('when a different vendor deletes the resource', () => {
      it('should return error', async () => {
        await rootURLRequest().delete(resourceLocation).auth(vendor2DataAccessToken, { type: 'bearer' }).expect(403);
      });
    });

    describe('when a host account requests the resource', () => {
      it('should return success', async () => {
        await rootURLRequest().delete(resourceLocation).auth(host1DataAccessToken, { type: 'bearer' }).expect(204);
      });
    });

    afterEach(async () => {
      await rootURLRequest()
        .delete(resourceLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });
  });
});

import { Credentials, createClient } from '../helpers/Credentials';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('given the existance of two vendors and one host', () => {
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

  let educationContentLocation = '';
  const educationContentEndpoint = 'EducationContents';
  const educationContentBody = {
    contentIdentifier: '933zsd4350',
    namespace: '43210',
    shortDescription: 'abc',
    contentClassDescriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
    learningResourceMetadataURI: '21430',
  };

  const educationContentBodyPOSTUpdated = {
    contentIdentifier: '933zsd4350',
    namespace: '43210',
    shortDescription: 'abc_POST',
    contentClassDescriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
    learningResourceMetadataURI: '21430',
  };

  const educationContentBodyPUTUpdated = {
    contentIdentifier: '933zsd4350',
    namespace: '43210',
    shortDescription: 'abc_PUT',
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
    await deleteResourceByLocation(contentClassDescriptorLocation);
  });

  // GET
  describe('given that Vendor 1 creates an educationContent', () => {
    beforeAll(async () => {
      await baseURLRequest()
        .post(`/v3.3b/ed-fi/${educationContentEndpoint}`)
        .send(educationContentBody)
        .auth(vendor1DataAccessToken, { type: 'bearer' })
        .expect(201)
        .then((response) => {
          expect(response).not.toBe('');
          educationContentLocation = response.headers.location;
        });

      expect(educationContentLocation).toBeTruthy();
    });

    it('Vendor 1 can get it', async () => {
      await rootURLRequest()
        .get(educationContentLocation)
        .auth(vendor1DataAccessToken, { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(expect.objectContaining(educationContentBody));
        });
    });

    it('Vendor 2 can not get it', async () => {
      await rootURLRequest().get(educationContentLocation).auth(vendor2DataAccessToken, { type: 'bearer' }).expect(403);
    });

    it('Host 1 can get it', async () => {
      await rootURLRequest().get(educationContentLocation).auth(host1DataAccessToken, { type: 'bearer' }).expect(200);
    });

    afterAll(async () => {
      await deleteResourceByLocation(educationContentLocation);
    });
  });

  // POST
  describe('given that Vendor 1 creates an educationContent', () => {
    beforeAll(async () => {
      await baseURLRequest()
        .post(`/v3.3b/ed-fi/${educationContentEndpoint}`)
        .send(educationContentBody)
        .auth(vendor1DataAccessToken, { type: 'bearer' })
        .expect(201)
        .then((response) => {
          expect(response).not.toBe('');
          educationContentLocation = response.headers.location;
        });

      expect(educationContentLocation).toBeTruthy();
    });

    describe('given a POST by Vendor 1 to the educationContent created', () => {
      it('should return upsert success', async () => {
        await rootURLRequest()
          .post(educationContentLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .send(educationContentBodyPOSTUpdated)
          .expect(200);
      });

      it('should return updated educationContent.', async () => {
        await rootURLRequest()
          .get(educationContentLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.objectContaining(educationContentBodyPOSTUpdated));
          });
      });
    });

    describe('given a POST by Vendor 2 to the educationContent created', () => {
      it('should return error', async () => {
        await rootURLRequest()
          .post(educationContentLocation)
          .auth(vendor2DataAccessToken, { type: 'bearer' })
          .send(educationContentBodyPOSTUpdated)
          .expect(403)
          .then((response) => {
            expect(response.body).toBe('');
          });
      });
    });

    describe('given a POST by Host 1 to the educationContent created', () => {
      it('should return upsert success', async () => {
        await rootURLRequest()
          .post(educationContentLocation)
          .auth(host1DataAccessToken, { type: 'bearer' })
          .send(educationContentBody)
          .expect(200);
      });

      it('should return updated educationContent.', async () => {
        await rootURLRequest()
          .get(educationContentLocation)
          .auth(host1DataAccessToken, { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.objectContaining(educationContentBody));
          });
      });
    });

    afterAll(async () => {
      await deleteResourceByLocation(educationContentLocation);
    });
  });

  // PUT
  describe('given that Vendor 1 creates an educationContent', () => {
    beforeAll(async () => {
      await baseURLRequest()
        .post(`/v3.3b/ed-fi/${educationContentEndpoint}`)
        .send(educationContentBody)
        .auth(vendor1DataAccessToken, { type: 'bearer' })
        .expect(201)
        .then((response) => {
          expect(response).not.toBe('');
          educationContentLocation = response.headers.location;
        });

      expect(educationContentLocation).toBeTruthy();
    });

    describe('given a PUT by Vendor 1 to the educationContent created', () => {
      it('should return success', async () => {
        await rootURLRequest()
          .put(educationContentLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .send(educationContentBodyPUTUpdated)
          .expect(204);
      });

      it('should return updated educationContent.', async () => {
        await rootURLRequest()
          .get(educationContentLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.objectContaining(educationContentBodyPUTUpdated));
          });
      });
    });

    describe('given a PUT by Vendor 2 to the educationContent created', () => {
      it('should return error', async () => {
        await rootURLRequest()
          .put(educationContentLocation)
          .auth(vendor2DataAccessToken, { type: 'bearer' })
          .send(educationContentBodyPUTUpdated)
          .expect(403)
          .then((response) => {
            expect(response.body).toBe('');
          });
      });
    });

    describe('given a PUT by Host 1 to the educationContent created', () => {
      it('should return upsert success', async () => {
        await rootURLRequest()
          .put(educationContentLocation)
          .auth(host1DataAccessToken, { type: 'bearer' })
          .send(educationContentBodyPUTUpdated)
          .expect(204);
      });

      it('should return updated educationContent.', async () => {
        await rootURLRequest()
          .get(educationContentLocation)
          .auth(host1DataAccessToken, { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.objectContaining(educationContentBodyPUTUpdated));
          });
      });
    });

    afterAll(async () => {
      await deleteResourceByLocation(educationContentLocation);
    });
  });

  // DELETE
  describe('given that Vendor 1 creates an educationContent', () => {
    beforeEach(async () => {
      await baseURLRequest()
        .post(`/v3.3b/ed-fi/${educationContentEndpoint}`)
        .send(educationContentBody)
        .auth(vendor1DataAccessToken, { type: 'bearer' })
        .then((response) => {
          expect([200, 201].indexOf(response.status)).toBeGreaterThan(-1);
          educationContentLocation = response.headers.location;
        });

      expect(educationContentLocation).toBeTruthy();
    });

    describe('given a DELETE by Vendor 1 to the educationContent created', () => {
      it('should return delete success', async () => {
        await rootURLRequest().delete(educationContentLocation).auth(vendor1DataAccessToken, { type: 'bearer' }).expect(204);
      });
    });

    describe('given a DELETE by Vendor 2 to the educationContent created', () => {
      it('should return error', async () => {
        await rootURLRequest().delete(educationContentLocation).auth(vendor2DataAccessToken, { type: 'bearer' }).expect(403);
      });

      it('Vendor 1 can still see it', async () => {
        await rootURLRequest()
          .get(educationContentLocation)
          .auth(vendor1DataAccessToken, { type: 'bearer' })
          .expect(200)
          .then((response) => {
            expect(response.body).toEqual(expect.objectContaining(educationContentBody));
          });

        await deleteResourceByLocation(educationContentLocation);
      });
    });

    describe('given a DELETE by Host 1 to the educationContent created', () => {
      it('should return success', async () => {
        await rootURLRequest().delete(educationContentLocation).auth(host1DataAccessToken, { type: 'bearer' }).expect(204);
      });
    });
  });
});

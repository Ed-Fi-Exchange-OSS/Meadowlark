// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config, Environment } from '@edfi/meadowlark-utilities';
import { getAccessToken } from '../helpers/Credentials';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('When creating a resource', () => {
  describe('given a missing property on a required collection', () => {
    it('should fail with message about the missing property', async () => {
      // This is entirely missing the "categories" collection
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor:
                'uri://ed-fi.org/EducationOrganizationIdentificationSystemDescriptor#SEA',
              identificationCode: '19',
            },
          ],
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": [
                {
                  "context": {
                    "errorType": "required",
                  },
                  "message": "{requestBody} must have required property 'categories'",
                  "path": "{requestBody}",
                },
              ],
            }
          `);
        });
    });
  });

  describe('given an empty array on a required collection', () => {
    it('should fail with message about the missing property', async () => {
      // This is has a "categories" array, but it is empty
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          categories: [],
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor:
                'uri://ed-fi.org/EducationOrganizationIdentificationSystemDescriptor#SEA',
              identificationCode: '19',
            },
          ],
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": [
                {
                  "context": {
                    "errorType": "minItems",
                  },
                  "message": "property 'categories' must not have fewer than 1 items",
                  "path": "{requestBody}.categories",
                },
              ],
            }
          `);
        });
    });
  });

  describe('given an empty descriptor value', () => {
    it('should fail with a message about the descriptor', async () => {
      // educationOrganizationIdentificationSystemDescriptor: '',
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          addresses: [],
          categories: [
            {
              educationOrganizationCategoryDescriptor: 'abc',
            },
          ],
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor: '',
              identificationCode: '19',
            },
          ],
          indicators: [],
          institutionTelephones: [],
          internationalAddresses: [],
        })
        .expect(409)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": {
                "failures": [
                  {
                    "identity": {
                      "descriptor": "abc",
                    },
                    "resourceName": "EducationOrganizationCategory",
                  },
                ],
                "message": "Reference validation failed",
              },
            }
          `);
        });
    });
  });

  describe('given an empty required string value', () => {
    it('should fail with a message about the property', async () => {
      // shortNameOfInstitution: '',
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: '',
          addresses: [],
          categories: [
            {
              educationOrganizationCategoryDescriptor: 'abc',
            },
          ],
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor: 'def',
              identificationCode: '19',
            },
          ],
          indicators: [],
          institutionTelephones: [],
          internationalAddresses: [],
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": [
                {
                  "context": {
                    "errorType": "minLength",
                  },
                  "message": "property 'shortNameOfInstitution' must not have fewer than 1 characters",
                  "path": "{requestBody}.shortNameOfInstitution",
                },
              ],
            }
          `);
        });
    });
  });

  describe('given a missing number property', () => {
    it('should fail with a message about the property', async () => {
      // communityOrganizationId
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          addresses: [],
          categories: [
            {
              educationOrganizationCategoryDescriptor: 'abc',
            },
          ],
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor: 'def',
              identificationCode: '19',
            },
          ],
          indicators: [],
          institutionTelephones: [],
          internationalAddresses: [],
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": [
                {
                  "context": {
                    "errorType": "required",
                  },
                  "message": "{requestBody} must have required property 'communityOrganizationId'",
                  "path": "{requestBody}",
                },
              ],
            }
          `);
        });
    });
  });

  describe('given empty arrays on optional collections', () => {
    it('should fail on reference validation instead of schema validation', async () => {
      // In other words, empty arrays are acceptable!
      await baseURLRequest()
        .post('/v3.3b/ed-fi/communityOrganizations')
        .auth(await getAccessToken('vendor'), { type: 'bearer' })
        .send({
          communityOrganizationId: 19,
          nameOfInstitution: 'Communities in Schools',
          shortNameOfInstitution: 'CIS',
          addresses: [],
          categories: [
            {
              educationOrganizationCategoryDescriptor: 'abc',
            },
          ],
          identificationCodes: [
            {
              educationOrganizationIdentificationSystemDescriptor: 'def',
              identificationCode: '19',
            },
          ],
          indicators: [],
          institutionTelephones: [],
          internationalAddresses: [],
        })
        .expect(409)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": {
                "failures": [
                  {
                    "identity": {
                      "descriptor": "abc",
                    },
                    "resourceName": "EducationOrganizationCategory",
                  },
                ],
                "message": "Reference validation failed",
              },
            }
            `);
        });
    });
  });

  describe('given an incorrect date format', () => {
    it('should return error message', async () => {
      await baseURLRequest()
        .post(`/v3.3b/ed-fi/academicWeeks`)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send({
          weekIdentifier: '123456',
          schoolReference: {
            schoolId: 100,
          },
          beginDate: 'January 1st, 2020',
          endDate: '2020/12/01',
          totalInstructionalDays: 50,
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": [
                {
                  "context": {
                    "errorType": "format",
                  },
                  "message": "property 'beginDate' must match format 'date'",
                  "path": "{requestBody}.beginDate",
                },
                {
                  "context": {
                    "errorType": "format",
                  },
                  "message": "property 'endDate' must match format 'date'",
                  "path": "{requestBody}.endDate",
                },
              ],
            }
          `);
        });
    });
  });
});

describe('When performing crud operations with extraneous elements with allow overposting true', () => {
  let resourceResponse;
  let getResourceResponse;
  const resource = 'contentClassDescriptors';
  const resourceEndpoint = `/v3.3b/ed-fi/${resource}`;
  const resourceBody = {
    codeValue: 'Presentation extraneous elements',
    description: 'Presentation extraneous elements',
    shortDescription: 'Presentation extraneous elements',
    namespace: 'uri://ed-fi.org/ContentClassDescriptor',
  };
  const resourceBodyWithExtraneousElements = {
    ...resourceBody,
    extraneousElement: 'extraneousElement',
    extraneousElement2: 'extraneousElement2',
  };
  let resourceBodyWithExtraneousElementsUpdate;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementationOnce((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return true;
      }
      return Environment.getBooleanFromEnvironment(key);
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when creating a new resource', () => {
    beforeAll(async () => {
      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyWithExtraneousElements)
        .then((response) => {
          resourceResponse = response;
        });
    });

    afterAll(async () => {
      await rootURLRequest()
        .delete(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });

    it('returns 201', () => {
      expect(resourceResponse.statusCode).toBe(201);
    });
  });

  describe('when getting an inserted resource', () => {
    beforeAll(async () => {
      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyWithExtraneousElements)
        .then((response) => {
          resourceResponse = response;
        });
      await rootURLRequest()
        .get(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .then((response) => {
          getResourceResponse = response;
        });
    });
    afterAll(async () => {
      await rootURLRequest()
        .delete(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });

    it('does not return extraneous elements', () => {
      const insertedResourceBody = {
        ...resourceResponse.body,
        id: resourceResponse.headers.location.split('/').pop(),
      };
      expect(getResourceResponse.body).toEqual(expect.objectContaining(insertedResourceBody));
    });
  });

  describe('when updating a resource', () => {
    let resourceLocation;
    beforeAll(async () => {
      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyWithExtraneousElements)
        .then((response) => {
          resourceResponse = response;
          resourceBodyWithExtraneousElementsUpdate = {
            ...resourceBodyWithExtraneousElements,
            id: response.headers.location.split('/').pop(),
            shortDescription: 'Presentation extraneous elements 2',
            extraneousElement: 'extraneousElement',
            extraneousElement2: 'extraneousElement2',
            extraneousElement3: 'extraneousElement3',
          };
          resourceLocation = resourceResponse.headers.location;
        });

      await rootURLRequest()
        .put(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyWithExtraneousElementsUpdate)
        .then((response) => {
          resourceResponse = response;
        });
    });

    afterAll(async () => {
      await rootURLRequest()
        .delete(resourceLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });

    it('returns 204', () => {
      expect(resourceResponse.statusCode).toBe(204);
    });
  });
});
describe('When performing crud operations with extraneous elements with allow overposting false', () => {
  let resourceResponse;
  const resource = 'contentClassDescriptors';
  const resourceEndpoint = `/v3.3b/ed-fi/${resource}`;
  const resourceBody = {
    codeValue: 'Presentation extraneous elements fails',
    description: 'Presentation extraneous elements fails',
    shortDescription: 'Presentation extraneous elements fails',
    namespace: 'uri://ed-fi.org/ContentClassDescriptor',
  };
  const resourceBodyWithExtraneousElements = {
    ...resourceBody,
    extraneousElement: 'extraneousElement',
    extraneousElement2: 'extraneousElement2',
  };
  let resourceBodyWithExtraneousElementsUpdate;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(Environment, 'getBooleanFromEnvironment').mockImplementationOnce((key: Config.ConfigKeys) => {
      if (key === 'ALLOW_OVERPOSTING') {
        return true;
      }
      return Environment.getBooleanFromEnvironment(key);
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when creating a new resource', () => {
    beforeAll(async () => {
      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyWithExtraneousElements)
        .then((response) => {
          resourceResponse = response;
        });
    });

    afterAll(async () => {
      await rootURLRequest()
        .delete(resourceResponse.headers.location)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });

    it('returns 400', () => {
      expect(resourceResponse.statusCode).toBe(400);
    });
  });
  describe('when updating a resource', () => {
    let resourceLocation;
    beforeAll(async () => {
      await baseURLRequest()
        .post(resourceEndpoint)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBody)
        .then((response) => {
          resourceBodyWithExtraneousElementsUpdate = {
            ...resourceBodyWithExtraneousElements,
            id: response.headers.location.split('/').pop(),
            shortDescription: 'Presentation extraneous elements 2',
            extraneousElement: 'extraneousElement',
            extraneousElement2: 'extraneousElement2',
            extraneousElement3: 'extraneousElement3',
          };
          resourceLocation = response.headers.location;
        });

      await rootURLRequest()
        .put(resourceLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' })
        .send(resourceBodyWithExtraneousElementsUpdate)
        .then((response) => {
          resourceResponse = response;
        });
    });

    afterAll(async () => {
      await rootURLRequest()
        .delete(resourceLocation)
        .auth(await getAccessToken('host'), { type: 'bearer' });
    });

    it('returns 400', () => {
      expect(resourceResponse.statusCode).toBe(400);
    });
  });
});

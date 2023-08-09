import autocannon from 'autocannon';
import axios from 'axios';
import { faker } from '@faker-js/faker';

async function getBearerToken(): Promise<string> {
  // Authenticate hardcoded admin
  const authenticateAdminResult = await axios.post(
    'http://localhost:3000/local/oauth/token',
    {
      grant_type: 'client_credentials',
      client_id: 'meadowlark_admin_key_1',
      client_secret: 'meadowlark_admin_secret_1',
    },
    {
      headers: { 'content-type': 'application/json' },
    },
  );

  const adminToken = authenticateAdminResult.data.access_token;

  // Create client
  const createClientResult = await axios.post(
    'http://localhost:3000/local/oauth/clients',
    {
      clientName: 'SIS',
      roles: ['vendor'],
    },
    {
      headers: { 'content-type': 'application/json', Authorization: `bearer ${adminToken}` },
    },
  );

  const clientId = createClientResult.data.client_id;
  const clientSecret = createClientResult.data.client_secret;

  // Authenticate client
  const authenticateClientResult = await axios.post(
    'http://localhost:3000/local/oauth/token',
    {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    },
    {
      headers: { 'content-type': 'application/json' },
    },
  );

  return authenticateClientResult.data.access_token;
}

async function main() {
  const bearerToken: string = await getBearerToken();

  // Create an initial EducationOrganizationCategory descriptor
  await axios.post(
    'http://localhost:3000/local/v3.3b/ed-fi/educationOrganizationCategoryDescriptors',
    {
      codeValue: 'Other',
      shortDescription: 'Other',
      description: 'Other',
      namespace: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor',
    },
    {
      headers: { 'content-type': 'application/json', Authorization: `bearer ${bearerToken}` },
    },
  );

  // Create an initial GradeLevel descriptor
  await axios.post(
    'http://localhost:3000/local/v3.3b/ed-fi/gradeLevelDescriptors',
    {
      codeValue: 'Other',
      shortDescription: 'Other',
      description: 'Other',
      namespace: 'uri://ed-fi.org/GradeLevelDescriptor',
    },
    {
      headers: { 'content-type': 'application/json', Authorization: `bearer ${bearerToken}` },
    },
  );

  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 10, // default
    duration: 60,

    requests: [
      // POST for creating a school
      {
        method: 'POST',
        path: '/local/v3.3b/ed-fi/schools',
        body: JSON.stringify({
          schoolId: faker.number.int(),
          nameOfInstitution: faker.person.fullName(),
          educationOrganizationCategories: [
            {
              educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#Other',
            },
          ],
          gradeLevels: [
            {
              gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Other',
            },
          ],
        }),
        headers: { 'content-type': 'application/json', Authorization: `bearer ${bearerToken}` },
      },
    ],
  });
  // eslint-disable-next-line no-console
  console.log(result);
}

(async () => main())();

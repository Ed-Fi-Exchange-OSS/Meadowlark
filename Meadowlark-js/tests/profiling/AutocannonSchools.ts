import autocannon, { Client } from 'autocannon';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import { getBearerToken } from './BearerToken';

const AUTOCANNON_DURATION_IN_SECONDS = 160;

export type AutocannonParameters = {
  bearerToken: string;
  urlPrefix: string;
};

/**
 * POST references that are required for Schools
 */
export async function postRequiredSchoolReferences({ bearerToken, urlPrefix }: AutocannonParameters): Promise<void> {
  // Create an initial EducationOrganizationCategory descriptor
  await axios.post(
    `${urlPrefix}/local/v3.3b/ed-fi/educationOrganizationCategoryDescriptors`,
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
    `${urlPrefix}/local/v3.3b/ed-fi/gradeLevelDescriptors`,
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
}

/**
 * Generates a new School document
 */
function newSchoolDocument(): string {
  return JSON.stringify({
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
  });
}

/**
 * Run autocannon to generate POSTs of Schools. Assumes required references already exist
 *
 * @returns An autocannon tracker/statistics object
 */
export async function autocannonSchools({ bearerToken, urlPrefix }: AutocannonParameters): Promise<any> {
  const instance = autocannon({
    url: urlPrefix,
    duration: AUTOCANNON_DURATION_IN_SECONDS,
    connections: 25,
    requests: [
      {
        method: 'POST',
        path: '/local/v3.3b/ed-fi/schools',
        body: newSchoolDocument(),
        headers: { 'content-type': 'application/json', Authorization: `bearer ${bearerToken}` },
      },
    ],
    setupClient: (client: Client) => {
      client.setBody(newSchoolDocument());
    },
  });

  return instance;
}

(async () => {
  const urlPrefix = 'http://localhost:3000';
  const bearerToken: string = await getBearerToken(urlPrefix);
  await postRequiredSchoolReferences({ bearerToken, urlPrefix });
  const result = await autocannonSchools({ bearerToken, urlPrefix });
  // eslint-disable-next-line no-console
  console.log(result);
})();

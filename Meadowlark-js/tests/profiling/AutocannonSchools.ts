import autocannon, { Client } from 'autocannon';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import { getBearerToken } from './BearerToken';

const AUTOCANNON_DURATION_IN_SECONDS_INSERTS = 60;

// The number of requests to make before exiting the benchmark. If set, previous duration value is ignored.
const AUTOCANNON_AMOUNT_REQUESTS_READ = 100000;

/** Set this flag to true if you want to collect the locations in order to autocannon the schools with get requests */
const COLLECT_LOCATIONS = false;
const schoolLocations: string[] = [];

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
    duration: AUTOCANNON_DURATION_IN_SECONDS_INSERTS,
    amount: 5000,
    connections: 50,
    requests: [
      {
        method: 'POST',
        path: '/local/v3.3b/ed-fi/schools',
        body: newSchoolDocument(),
        headers: { 'content-type': 'application/json', Authorization: `bearer ${bearerToken}` },
        onResponse: (status, _body, _context, headers) => {
          if (COLLECT_LOCATIONS && status === 201) {
            schoolLocations.push(headers.location);
          }
        },
      },
    ],
    setupClient: (client: Client) => {
      client.setBody(newSchoolDocument());
    },
  });

  return instance;
}

/**
 * Returns a random school location from the autocannon inserts.
 *
 * @returns School Location
 */
function getRandomSchoolLocations(): string {
  const index = faker.number.int({ min: 0, max: schoolLocations.length - 1 });
  return schoolLocations[index];
}

/**
 * Run autocannon to read Schools.
 *
 * @returns An autocannon tracker/statistics object
 */
export async function autocannonSchoolsGet({ bearerToken, urlPrefix }: AutocannonParameters): Promise<any> {
  const instance = autocannon({
    url: urlPrefix,
    amount: AUTOCANNON_AMOUNT_REQUESTS_READ, // When I set an amount of requests, the duration is ignored.
    connections: 25,
    requests: [
      {
        method: 'GET',
        path: `${getRandomSchoolLocations()}`,
        headers: { 'content-type': 'application/json', Authorization: `bearer ${bearerToken}` },
        // onResponse: (status, body, _context) => {
        //   if (status === 200) {
        //     // eslint-disable-next-line no-console
        //     console.log(body);
        //   } // on error, you may abort the benchmark
        // },
      },
    ],
  });

  return instance;
}

(async () => {
  const urlPrefix = 'http://127.0.0.1:3000';
  const bearerToken: string = await getBearerToken(urlPrefix);
  await postRequiredSchoolReferences({ bearerToken, urlPrefix });

  // eslint-disable-next-line no-console
  console.time('autocannon_schools_inserts');

  let result = await autocannonSchools({ bearerToken, urlPrefix });
  // eslint-disable-next-line no-console
  console.log(result);

  // eslint-disable-next-line no-console
  console.timeEnd('autocannon_schools_inserts');

  if (COLLECT_LOCATIONS && schoolLocations.length > 0) {
    // eslint-disable-next-line no-console
    console.time('autocannon_schools_get');

    result = await autocannonSchoolsGet({ bearerToken, urlPrefix });

    // eslint-disable-next-line no-console
    console.log(result);

    // eslint-disable-next-line no-console
    console.timeEnd('autocannon_schools_get');
  }
})();

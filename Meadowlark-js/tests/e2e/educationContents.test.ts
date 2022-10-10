import path from 'path';
import dotenv from 'dotenv';
import request from 'supertest';

dotenv.config({path: path.join(__dirname, "./.env")});

let token: string;
let educationContentLocation: string;
let contentClassDescriptor: string;

const rootURL = request(process.env.ROOT_URL);
const baseURL = request(process.env.BASE_URL);

describe('Create education content', () => {

  beforeAll(async () => {
    const response = await baseURL
      .post('/api/oauth/token')
      .send({
        "grant_type": "client_credentials",
        "client_id": process.env.CLIENT_ID,
        "client_secret": process.env.CLIENT_SECRET
      });

    token = response.body.access_token;
  });

  beforeEach(async () => {
    const response = await baseURL
      .post(`/v3.3b/ed-fi/contentClassDescriptors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        "codeValue": "Presentation",
        "shortDescription": "Presentation",
        "description": "Presentation",
        "namespace": "uri://ed-fi.org/ContentClassDescriptor"
      })
      .expect(200);

    const contentClassLocation = response.headers[ 'location' ];

    if (!contentClassLocation) {
      throw "Location not found";
    }

    const locatorByDescriptor = await rootURL
      .get(contentClassLocation)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    contentClassDescriptor = locatorByDescriptor.body.namespace + "#" + locatorByDescriptor.body.description;
  });

  it('should create an education content', async () => {

    const educationContent = await baseURL
      .post('/v3.3b/ed-fi/educationContents')
      .set("Authorization", `Bearer ${token}`)
      .send({
        "contentIdentifier": `1fae${Math.floor(Math.random() * 100)}`,
        "namespace": "43210",
        "shortDescription": "ShortDesc",
        "contentClassDescriptor": contentClassDescriptor,
        "learningResourceMetadataURI": "uri://ed-fi.org/fake-uri"
      })
      .expect(201);

    educationContentLocation = educationContent.headers[ 'location' ];

    if (!educationContentLocation) {
      throw "Location not found";
    }

    rootURL.get(educationContentLocation).set("Authorization", `Bearer ${token}`).expect(200);
  })

  afterAll(async () => {
    await deleteByLocation(educationContentLocation);
  });
});

async function deleteByLocation(location: string) {
  await rootURL.delete(location)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);
}

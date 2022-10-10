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

    const contentClassDescriptorLocation = await baseURL
      .post(`/v3.3b/ed-fi/contentClassDescriptors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        "codeValue": "Presentation",
        "shortDescription": "Presentation",
        "description": "Presentation",
        "namespace": "uri://ed-fi.org/ContentClassDescriptor"
      })
      .expect(200)
      .then(response => {
        expect(response.headers[ 'location' ]).not.toBe(null);
        return response.headers[ 'location' ];
      });

    contentClassDescriptor = await rootURL
      .get(contentClassDescriptorLocation)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(response => {
        expect(response.body).not.toBe(null);
        return response.body.namespace + "#" + response.body.description;
      });
  });

  it('should create an education content', async () => {

    educationContentLocation = await baseURL
      .post('/v3.3b/ed-fi/educationContents')
      .set("Authorization", `Bearer ${token}`)
      .send({
        "contentIdentifier": `1fae${Math.floor(Math.random() * 100)}`,
        "namespace": "43210",
        "shortDescription": "ShortDesc",
        "contentClassDescriptor": contentClassDescriptor,
        "learningResourceMetadataURI": "uri://ed-fi.org/fake-uri"
      })
      .expect(201)
      .then(response => {
        expect(response.headers[ 'location' ]).not.toBe(null);
        return response.headers[ 'location' ];
      });

    rootURL
      .get(educationContentLocation)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((error, _) => {
        if (error) {
          console.error(error);
        }
      });
  })

  afterAll(() => {
    deleteByLocation(educationContentLocation);
  });
});

function deleteByLocation(location: string) {
  rootURL.delete(location)
    .set("Authorization", `Bearer ${token}`)
    .expect(204)
    .end((error, _) => {
      if (error) {
        console.error(error);
      }
    });
}

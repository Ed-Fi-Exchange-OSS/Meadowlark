import request from 'supertest';

let token: string;
let educationContentLocation: string;
let contentClassDescriptor: string;

const req = request("http://localhost:3000");

describe('Create education content', () => {

  beforeAll(async () => {
    const clientId = "meadowlark_key_1";
    const clientSecret = "meadowlark_secret_1";

    const response = await req
      .post('/local/api/oauth/token')
      .send({
        "grant_type": "client_credentials",
        "client_id": clientId,
        "client_secret": clientSecret
      });

    token = response.body.access_token;

  });

  beforeEach(async () => {
    const response = await req
      .post(`/local/v3.3b/ed-fi/contentClassDescriptors`)
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

    const locatorByDescriptor = await req
      .get(contentClassLocation)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    contentClassDescriptor = locatorByDescriptor.body.namespace + "#" + locatorByDescriptor.body.description;
  });

  it('should create an education content', async () => {

    const educationContent = await req
      .post('/local/v3.3b/ed-fi/educationContents')
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

    req.get(educationContentLocation).set("Authorization", `Bearer ${token}`).expect(200);
  })

  afterAll(async () => {
    await deleteByLocation(educationContentLocation);
  });

});

async function deleteByLocation(location: string) {
  await req.delete(location)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);
}

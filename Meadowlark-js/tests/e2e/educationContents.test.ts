import {baseURLRequest, getAccessToken, rootURLRequest} from './SharedFunctions';

let token: string;
let educationContentLocation: string;
let contentClassDescriptor: string;

describe('Create education content', () => {

  beforeAll(async () => {
    token = await getAccessToken();
  });

  beforeEach(async () => {

    const contentClassDescriptorLocation = await baseURLRequest
      .post(`/v3.3b/ed-fi/contentClassDescriptors`)
      .auth(token, {type: 'bearer'})
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

    contentClassDescriptor = await rootURLRequest
      .get(contentClassDescriptorLocation)
      .auth(token, {type: 'bearer'})
      .expect(200)
      .then(response => {
        expect(response.body).not.toBe(null);
        return response.body.namespace + "#" + response.body.description;
      });
  });

  it('should create an education content', async () => {

    educationContentLocation = await baseURLRequest
      .post('/v3.3b/ed-fi/educationContents')
      .auth(token, {type: 'bearer'})
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

    rootURLRequest
      .get(educationContentLocation)
      .auth(token, {type: 'bearer'})
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
  rootURLRequest.delete(location)
    .auth(token, {type: 'bearer'})
    .expect(204)
    .end((error, _) => {
      if (error) {
        console.error(error);
      }
    });
}

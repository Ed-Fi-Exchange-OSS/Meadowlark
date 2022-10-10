import {baseURLRequest, accessToken, rootURLRequest} from './SharedFunctions';

let educationContentLocation: string;
let contentClassDescriptor: string;

describe('Create education content', () => {

  beforeEach(async () => {

    const contentClassDescriptorLocation = await baseURLRequest
      .post(`/v3.3b/ed-fi/contentClassDescriptors`)
      .auth(accessToken, {type: 'bearer'})
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
      .auth(accessToken, {type: 'bearer'})
      .expect(200)
      .then(response => {
        expect(response.body).not.toBe(null);
        return response.body.namespace + "#" + response.body.description;
      });
  });

  it('should create an education content', async () => {

    educationContentLocation = await baseURLRequest
      .post('/v3.3b/ed-fi/educationContents')
      .auth(accessToken, {type: 'bearer'})
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
      .auth(accessToken, {type: 'bearer'})
      .expect(200)
      .end((error, _) => {
        if (error) {
          console.error(error);
        }
      });
  })

  afterAll(() => {
    rootURLRequest.delete(educationContentLocation)
      .auth(accessToken, {type: 'bearer'})
      .expect(204)
      .end((error, _) => {
        if (error) {
          console.error(error);
        }
      });
  });
});

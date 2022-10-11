import {baseURLRequest, rootURLRequest, generateRandomId, getAccessToken} from './SharedFunctions';

let educationContentLocation: string;
let contentClassDescriptor: string;

describe('Create education content', () => {

  beforeEach(async () => {
    const contentClassDescriptorLocation = await baseURLRequest
      .post(`/v3.3b/ed-fi/contentClassDescriptors`)
      .auth(await getAccessToken(), {type: 'bearer'})
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
      .auth(await getAccessToken(), {type: 'bearer'})
      .expect(200)
      .then(response => {
        expect(response.body).not.toBe(null);
        return response.body.namespace + "#" + response.body.description;
      });
  });

  it('should create an education content', async () => {

    educationContentLocation = await baseURLRequest
      .post('/v3.3b/ed-fi/educationContents')
      .auth(await getAccessToken(), {type: 'bearer'})
      .send({
        "contentIdentifier": generateRandomId(),
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
      .auth(await getAccessToken(), {type: 'bearer'})
      .expect(200)
      .end((error, _) => {
        if (error) {
          console.error(error);
        }
      });
  })

  afterAll(async () => {
    rootURLRequest.delete(educationContentLocation)
      .auth(await getAccessToken(), {type: 'bearer'})
      .expect(204)
      .end((error, _) => {
        if (error) {
          console.error(error);
        }
      });
  });
});

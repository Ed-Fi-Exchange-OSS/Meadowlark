// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { deleteIt } from '../../../src/handler/CrudHandler';
// import * as RequestValidator from '../../../src/handler/RequestValidator';
// import { ForeignKeyItem } from '../../../src/model/ForeignKeyItem';
// import { DeleteResult } from '../../../src/repository/BaseDynamoRepository';
// import * as DynamoEntityRepository from '../../../src/repository/DynamoEntityRepository';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

// describe("given there's a validation error", () => {
//   let response: APIGatewayProxyResult;
//   const path = '/v3.3b/ed-fi/academicWeeks/6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7';
//   let mockRequestValidator: any;
//   const metaEdHeaders = { header: 'one' };
//   const validationError = { 'this is': 'an error' };

//   beforeAll(async () => {
//     const event: APIGatewayProxyEvent = {
//       path,
//       headers: { 'reference-validation': false },
//       requestContext: { requestId: 'ApiGatewayRequestId' },
//     } as any;
//     const context = { awsRequestId: 'LambdaRequestId' } as Context;

//     // Setup the request validation to fail
//     mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
//       Promise.resolve(({
//         entityInfo: {},
//         errorBody: validationError,
//         metaEdProjectHeaders: metaEdHeaders,
//       } as unknown) as RequestValidator.ResourceValidationResult),
//     );

//     // Act
//     response = await deleteIt(event, context);
//   });

//   afterAll(() => {
//     mockRequestValidator.mockRestore();
//   });

//   it('returns status 400', () => {
//     expect(response.statusCode).toEqual(400);
//   });
//   it('returns the expected error message', () => {
//     expect(response.body).toEqual(validationError);
//   });
// });

// describe('given persistence fails', () => {
//   let response: APIGatewayProxyResult;
//   const mocks: any[] = [];
//   const path = '/v3.3b/ed-fi/academicWeeks/6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7';
//   const metaEdHeaders = { header: 'one' };

//   beforeAll(async () => {
//     const event: APIGatewayProxyEvent = {
//       path,
//       headers: { 'reference-validation': false },
//       pathParameters: {
//         proxy: 'v3.3b/ed-fi/sections/123456',
//       },
//       requestContext: { requestId: 'ApiGatewayRequestId' },
//     } as any;
//     const context = { awsRequestId: 'LambdaRequestId' } as Context;

//     // Setup the request validation to succeed
//     mocks.push(
//       jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
//         Promise.resolve(({
//           entityInfo: {},
//           errorBody: null,
//           metaEdProjectHeaders: metaEdHeaders,
//         } as unknown) as RequestValidator.ResourceValidationResult),
//       ),
//     );

//     // Setup the Dynamo operation to fail
//     mocks.push(
//       jest.spyOn(DynamoEntityRepository, 'deleteEntityById').mockReturnValue(
//         Promise.resolve({
//           success: false,
//         } as DeleteResult),
//       ),
//     );

//     // Setup the lookup of child references to return nothing
//     mocks.push(
//       jest.spyOn(DynamoEntityRepository, 'getReferencesToThisItem').mockReturnValue(
//         Promise.resolve({
//           success: true,
//           foreignKeys: [],
//         }),
//       ),
//     );

//     // Act
//     response = await deleteIt(event, context);
//   });

//   afterAll(() => {
//     mocks.forEach((mock) => mock.mockRestore());
//   });

//   it('returns status 500', () => {
//     expect(response.statusCode).toEqual(500);
//   });

//   it('returns expected headers', () => {
//     expect(response.headers).toEqual(metaEdHeaders);
//   });
// });

// describe('given a valid request', () => {
//   describe('given there are no foreign keys to this item', () => {
//     describe('given this item has one foreign key', () => {
//       let response: APIGatewayProxyResult;
//       const mocks: any[] = [];
//       const path = '/v3.3b/ed-fi/academicWeeks/6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7';
//       const metaEdHeaders = { header: 'one' };

//       beforeAll(async () => {
//         const event: APIGatewayProxyEvent = {
//           path,
//           headers: { 'strict-validation': false },
//           requestContext: { requestId: 'ApiGatewayRequestId' },
//         } as any;
//         const context = { awsRequestId: 'LambdaRequestId' } as Context;

//         // Setup the request validation to succeed
//         mocks.push(
//           jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
//             Promise.resolve(({
//               entityInfo: {},
//               errorBody: null,
//               metaEdProjectHeaders: metaEdHeaders,
//             } as unknown) as RequestValidator.ResourceValidationResult),
//           ),
//         );

//         // Setup the primary delete operation to succeed
//         mocks.push(
//           jest.spyOn(DynamoEntityRepository, 'deleteEntityById').mockReturnValue(
//             Promise.resolve({
//               success: true,
//             } as DeleteResult),
//           ),
//         );

//         // Setup the lookup of child references to return nothing
//         mocks.push(
//           jest.spyOn(DynamoEntityRepository, 'getReferencesToThisItem').mockReturnValue(
//             Promise.resolve({
//               success: true,
//               foreignKeys: [],
//             }),
//           ),
//         );

//         // This item has a foreign keys
//         mocks.push(
//           jest.spyOn(DynamoEntityRepository, 'getForeignKeyReferences').mockReturnValue(
//             Promise.resolve({
//               success: true,
//               foreignKeys: [
//                 new ForeignKeyItem({
//                   From: 'a',
//                   To: 'b',
//                   Description: {
//                     NaturalKey: 'c',
//                     Type: 'd',
//                   },
//                 }),
//               ],
//             }),
//           ),
//         );

//         // Act
//         response = await deleteIt(event, context);
//       });

//       afterAll(() => {
//         mocks.forEach((mock) => mock.mockRestore());
//       });

//       it('returns status 204', () => {
//         expect(response.statusCode).toEqual(204);
//       });

//       it('returns expected headers', () => {
//         expect(response.headers).toEqual(metaEdHeaders);
//       });

//       it('returns no message in body', () => {
//         expect(response.body).toEqual('');
//       });
//     });

//     describe('and given this item itself has no foreign keys', () => {
//       let response: APIGatewayProxyResult;
//       const mocks: any[] = [];
//       const path = '/v3.3b/ed-fi/academicWeeks/6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7';
//       const metaEdHeaders = { header: 'one' };

//       beforeAll(async () => {
//         const event: APIGatewayProxyEvent = {
//           path,
//           headers: { 'strict-validation': false },
//           requestContext: { requestId: 'ApiGatewayRequestId' },
//         } as any;
//         const context = { awsRequestId: 'LambdaRequestId' } as Context;

//         // Setup the request validation to succeed
//         mocks.push(
//           jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
//             Promise.resolve(({
//               entityInfo: {},
//               errorBody: null,
//               metaEdProjectHeaders: metaEdHeaders,
//             } as unknown) as RequestValidator.ResourceValidationResult),
//           ),
//         );

//         // Setup the primary delete operation to succeed
//         mocks.push(
//           jest.spyOn(DynamoEntityRepository, 'deleteEntityById').mockReturnValue(
//             Promise.resolve({
//               success: true,
//             } as DeleteResult),
//           ),
//         );

//         // Setup the lookup of child references to return nothing
//         mocks.push(
//           jest.spyOn(DynamoEntityRepository, 'getReferencesToThisItem').mockReturnValue(
//             Promise.resolve({
//               success: true,
//               foreignKeys: [],
//             }),
//           ),
//         );

//         // This item itself does not have any foreign keys
//         mocks.push(
//           jest.spyOn(DynamoEntityRepository, 'getForeignKeyReferences').mockReturnValue(
//             Promise.resolve({
//               success: true,
//               foreignKeys: [],
//             }),
//           ),
//         );

//         // Act
//         response = await deleteIt(event, context);
//       });

//       afterAll(() => {
//         mocks.forEach((mock) => mock.mockRestore());
//       });

//       it('returns status 204', () => {
//         expect(response.statusCode).toEqual(204);
//       });

//       it('returns expected headers', () => {
//         expect(response.headers).toEqual(metaEdHeaders);
//       });

//       it('returns no message in body', () => {
//         expect(response.body).toEqual('');
//       });
//     });
//   });

//   describe('and given there is a foreign key to this item', () => {
//     let response: APIGatewayProxyResult;
//     const mocks: any[] = [];
//     const path = '/v3.3b/ed-fi/academicWeeks/6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7';
//     const metaEdHeaders = { header: 'one' };
//     const message =
//       '{"error":"Unable to delete this item because there are foreign keys pointing to it","foreignKeys":[{"NaturalKey":"c","Type":"d"}]}';

//     beforeAll(async () => {
//       const event: APIGatewayProxyEvent = {
//         path,
//         headers: { 'strict-validation': false },
//         requestContext: { requestId: 'ApiGatewayRequestId' },
//       } as any;
//       const context = { awsRequestId: 'LambdaRequestId' } as Context;

//       // Setup the request validation to succeed
//       mocks.push(
//         jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
//           Promise.resolve(({
//             entityInfo: {},
//             errorBody: null,
//             metaEdProjectHeaders: metaEdHeaders,
//           } as unknown) as RequestValidator.ResourceValidationResult),
//         ),
//       );

//       // Setup the primary delete operation to succeed
//       mocks.push(
//         jest.spyOn(DynamoEntityRepository, 'deleteEntityById').mockReturnValue(
//           Promise.resolve({
//             success: true,
//           } as DeleteResult),
//         ),
//       );

//       // Setup the lookup of child references to return one item
//       mocks.push(
//         jest.spyOn(DynamoEntityRepository, 'getReferencesToThisItem').mockReturnValue(
//           Promise.resolve({
//             success: true,
//             foreignKeys: [
//               new ForeignKeyItem({
//                 From: 'a',
//                 To: 'b',
//                 Description: {
//                   NaturalKey: 'c',
//                   Type: 'd',
//                 },
//               }),
//             ],
//           }),
//         ),
//       );

//       // This item itself does not have any foreign keys
//       mocks.push(
//         jest.spyOn(DynamoEntityRepository, 'getForeignKeyReferences').mockReturnValue(
//           Promise.resolve({
//             success: true,
//             foreignKeys: [],
//           }),
//         ),
//       );

//       // Act
//       response = await deleteIt(event, context);
//     });

//     afterAll(() => {
//       mocks.forEach((mock) => mock.mockRestore());
//     });

//     it('returns status 409', () => {
//       expect(response.statusCode).toEqual(409);
//     });

//     it('returns expected headers', () => {
//       expect(response.headers).toEqual(metaEdHeaders);
//     });

//     it('returns a message in body', () => {
//       expect(response.body).toEqual(message);
//     });
//   });
// });

// describe('given a path that validates but without an id', () => {
//   let response: APIGatewayProxyResult;
//   let mockRequestValidator: any;
//   let mockDynamo: any;
//   const path = '/v3.3b/ed-fi/academicWeeks';
//   const metaEdHeaders = { header: 'one' };

//   beforeAll(async () => {
//     const event: APIGatewayProxyEvent = {
//       path,
//       headers: { 'reference-validation': false },
//       requestContext: { requestId: 'ApiGatewayRequestId' },
//     } as any;
//     const context = { awsRequestId: 'LambdaRequestId' } as Context;

//     // Setup the request validation to succeed
//     mockRequestValidator = jest.spyOn(RequestValidator, 'validateResource').mockReturnValue(
//       Promise.resolve(({
//         entityInfo: {},
//         errorBody: null,
//         metaEdProjectHeaders: metaEdHeaders,
//       } as unknown) as RequestValidator.ResourceValidationResult),
//     );

//     // Setup the Dynamo operation to succeed
//     mockDynamo = jest.spyOn(DynamoEntityRepository, 'deleteEntityById').mockReturnValue(
//       Promise.resolve({
//         success: true,
//       } as DeleteResult),
//     );

//     // Act
//     response = await deleteIt(event, context);
//   });

//   afterAll(() => {
//     mockRequestValidator.mockRestore();
//     mockDynamo.mockRestore();
//   });

//   it('returns status 404', () => {
//     expect(response.statusCode).toEqual(404);
//   });

//   it('returns no message in body', () => {
//     expect(response.body).toEqual('');
//   });
// });

describe('given requesting abstract classes', () => {
  const response: APIGatewayProxyResult[] = [];

  beforeAll(async () => {
    const event: APIGatewayProxyEvent = {
      headers: { 'reference-validation': false },
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: '/v3.3b/ed-fi/educationOrganizations/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830',
    } as any;
    const context = { awsRequestId: 'LambdaRequestId' } as Context;

    // Act
    response[0] = await deleteIt(event, context);

    event.path = '/v3.3b/ed-fi/GeneralStudentProgramAssociations/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830';
    response[1] = await deleteIt(event, context);
  });

  it('returns status 404', () => {
    expect(response[0].statusCode).toEqual(404);
    expect(response[1].statusCode).toEqual(404);
  });

  it('returns the expected message body', () => {
    expect(response[0].body).toEqual(
      '{"message":"Invalid resource \'educationOrganizations\'. The most similar resource is \'educationOrganizationNetworks\'."}',
    );
    expect(response[1].body).toEqual(
      '{"message":"Invalid resource \'GeneralStudentProgramAssociations\'. The most similar resource is \'studentProgramAssociations\'."}',
    );
  });
});

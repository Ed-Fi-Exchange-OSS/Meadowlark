// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { deleteIt } from '../../src/handler/Delete';
import { FrontendRequest } from '../../src/handler/FrontendRequest';
import { FrontendResponse } from '../../src/handler/FrontendResponse';

process.env.ACCESS_TOKEN_REQUIRED = 'false';

describe('given requesting abstract classes', () => {
  const response: FrontendResponse[] = [];

  beforeAll(async () => {
    const event: FrontendRequest = {
      headers: { 'reference-validation': false },
      requestContext: { requestId: 'ApiGatewayRequestId' },
      path: '/v3.3b/ed-fi/educationOrganizations/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830',
    } as any;

    // Act
    response[0] = await deleteIt(event);

    event.path = '/v3.3b/ed-fi/GeneralStudentProgramAssociations/a0df76bba8212ea9b1a20c29591e940045dec9d65ee89603c31f0830';
    response[1] = await deleteIt(event);
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

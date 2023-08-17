// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  FrontendRequest,
  newFrontendRequest,
  newFrontendRequestMiddleware,
  removeReferencesDocumentIdentity,
} from '../../src/handler/FrontendRequest';

const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  middleware: {
    ...newFrontendRequestMiddleware(),
    documentInfo: {
      documentIdentity: { rootIdentity: 'keyRoot' },
      documentReferences: [
        {
          documentIdentity: { documentReference: 'keySensitiveToBeRemoved' },
          isDescriptor: false,
          projectName: 'projectName',
          resourceName: 'resourceName',
        },
      ],
      descriptorReferences: [
        {
          documentIdentity: { descriptorReference: 'keyDescriptor' },
          isDescriptor: true,
          projectName: 'projectName',
          resourceName: 'resourceName2',
        },
      ],
      superclassInfo: {
        documentIdentity: { superclassInfo: 'keySuperclassInfo' },
        projectName: 'Test',
        resourceName: 'resource',
      },
      requestTimestamp: 0,
    },
  },
};

describe('given a document with document references', () => {
  const request: FrontendRequest = frontendRequest;
  let queryResult: FrontendRequest;
  beforeAll(() => {
    // Act
    queryResult = removeReferencesDocumentIdentity(request);
  });
  it('should remove documentIdentity from documentReferences', async () => {
    // Assert
    expect(queryResult.middleware.documentInfo.documentReferences[0].documentIdentity).toEqual(undefined);
  });
});

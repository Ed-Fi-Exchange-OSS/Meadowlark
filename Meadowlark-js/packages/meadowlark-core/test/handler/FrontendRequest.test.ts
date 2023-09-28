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
import { DocumentObjectKey } from '../../src/model/api-schema/DocumentObjectKey';
import { MetaEdProjectName } from '../../src/model/api-schema/MetaEdProjectName';
import { MetaEdResourceName } from '../../src/model/api-schema/MetaEdResourceName';

const frontendRequest: FrontendRequest = {
  ...newFrontendRequest(),
  middleware: {
    ...newFrontendRequestMiddleware(),
    documentInfo: {
      documentIdentity: [{ documentKey: 'rootIdentity' as DocumentObjectKey, documentValue: 'keyRoot' }],
      documentReferences: [
        {
          documentIdentity: [
            { documentKey: 'documentReference' as DocumentObjectKey, documentValue: 'keySensitiveToBeRemoved' },
          ],
          isDescriptor: false,
          projectName: 'projectName' as MetaEdProjectName,
          resourceName: 'resourceName' as MetaEdResourceName,
        },
      ],
      descriptorReferences: [
        {
          documentIdentity: [{ documentKey: 'descriptorReference' as DocumentObjectKey, documentValue: 'keyDescriptor' }],
          isDescriptor: true,
          projectName: 'projectName' as MetaEdProjectName,
          resourceName: 'resourceName2' as MetaEdResourceName,
        },
      ],
      superclassInfo: {
        documentIdentity: [{ documentKey: 'superclassInfo' as DocumentObjectKey, documentValue: 'keySuperclassInfo' }],
        projectName: 'Test' as MetaEdProjectName,
        resourceName: 'resource' as MetaEdResourceName,
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

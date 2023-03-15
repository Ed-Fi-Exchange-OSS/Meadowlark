// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { initializeLogging } from '@edfi/meadowlark-utilities';
import { get } from '../../src/handler/FrontendFacade';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { setupMockConfiguration } from '../ConfigHelper';
import * as AuthorizationMiddleware from '../../src/middleware/AuthorizationMiddleware';
import * as PluginLoader from '../../src/plugin/PluginLoader';
import type { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { NoDocumentStorePlugin } from '../../src/plugin/backend/NoDocumentStorePlugin';

const documentUuid = '2edb604f-eab0-412c-a242-508d6529214d';

describe('given environment is set', () => {
  let middlewareMock: any;

  beforeAll(async () => {
    setupMockConfiguration();
    initializeLogging();

    jest.spyOn(PluginLoader, 'getDocumentStore').mockReturnValue(NoDocumentStorePlugin);
  });

  afterEach(() => {
    middlewareMock.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('given there is no resourceId in a get request', () => {
    const frontendRequest: FrontendRequest = { ...newFrontendRequest(), path: '/1/2/3' };

    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: { statusCode: 200 },
      };

      middlewareMock = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);

      // Act
      await get(frontendRequest);
    });

    it('sets the action to query', () => {
      expect(frontendRequest.action).toEqual('query');
    });
  });

  describe('given there is a resourceId in a get request', () => {
    const frontendRequest = {
      ...newFrontendRequest(),
      path: `/1/2/3/${documentUuid}`,
    };

    beforeAll(async () => {
      const model: MiddlewareModel = {
        frontendRequest,
        frontendResponse: { statusCode: 200 },
      };

      middlewareMock = jest.spyOn(AuthorizationMiddleware, 'authorize').mockResolvedValue(model);
      // Act
      await get(frontendRequest);
    });

    it('sets the action to getById', () => {
      expect(frontendRequest.action).toEqual('getById');
    });
  });
});

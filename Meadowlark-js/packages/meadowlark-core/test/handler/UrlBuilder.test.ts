// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest } from '../../src/handler/FrontendRequest';
import { buildBaseUrlFromRequest } from '../../src/handler/UrlBuilder';

describe('When building a base URL from an incoming request', () => {
  describe('given the local stage', () => {
    it('builds the URL using http protocol', () => {
      const frontendRequest: any = {
        stage: 'local',
        headers: {
          host: 'localhost',
        },
      };

      const response = buildBaseUrlFromRequest(frontendRequest as FrontendRequest);

      expect(response).toBe('http://localhost/local');
    });
  });

  describe('given prod stage', () => {
    it('builds the URL using https protocol', () => {
      const frontendRequest: any = {
        stage: 'prod',
        headers: {
          host: 'remotehost',
        },
      };

      const response = buildBaseUrlFromRequest(frontendRequest as FrontendRequest);

      expect(response).toBe('https://remotehost/prod');
    });
  });
});

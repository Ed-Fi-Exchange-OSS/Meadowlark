// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { CreateAuthorizationClientRequest } from '@edfi/meadowlark-authz-server';
import { AuthorizationDocument, authorizationDocumentFromCreate } from '../../src/model/AuthorizationDocument';

describe('when creating an authorization document', () => {
  describe('given a it is not a bootstrap admin', () => {
    let result: AuthorizationDocument;

    beforeAll(() => {
      const request: CreateAuthorizationClientRequest = {
        clientId: 'a',
        clientSecretHashed: 'b',
        clientName: 'c',
        active: false,
        roles: ['assessment'],
        traceId: 'd',
      };

      result = authorizationDocumentFromCreate(request);
    });

    it('maps the clientId correctly', () => {
      // eslint-disable-next-line no-underscore-dangle
      expect(result._id).toBe('a');
    });

    it('maps the clientSecretHashed correctly', () => {
      expect(result.clientSecretHashed).toBe('b');
    });

    it('maps the clientName correctly', () => {
      expect(result.clientName).toBe('c');
    });

    it('maps active correctly', () => {
      expect(result.active).toBe(false);
    });

    it('maps the roles correctly', () => {
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0]).toBe('assessment');
    });
  });
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { newTopLevelEntity } from '@edfi/metaed-core';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { schoolYearValidation } from '../../src/middleware/ValidateSchoolYearMiddleware';
import * as SchoolYearValidator from '../../src/validation/SchoolYearValidator';

describe('when validating a school year reference', () => {
  describe('given a previous middleware has created a response', () => {
    const frontendRequest: FrontendRequest = newFrontendRequest();
    const frontendResponse: FrontendResponse = newFrontendResponse();
    let resultChain: MiddlewareModel;
    let mockDocumentValidator: any;

    beforeAll(async () => {
      mockDocumentValidator = jest.spyOn(SchoolYearValidator, 'validateDocument');

      // Act
      resultChain = await schoolYearValidation({ frontendRequest, frontendResponse });
    });

    afterAll(() => {
      mockDocumentValidator.mockRestore();
    });

    it('returns the given request', () => {
      expect(resultChain.frontendRequest).toBe(frontendRequest);
    });

    it('returns the given response', () => {
      expect(resultChain.frontendResponse).toBe(frontendResponse);
    });

    it('never calls validateDocument', () => {
      expect(mockDocumentValidator).not.toHaveBeenCalled();
    });
  });

  describe('given the document does not contain a school year', () => {
    const frontendRequest: FrontendRequest = newFrontendRequest();
    frontendRequest.middleware.matchingMetaEdModel = {
      ...newTopLevelEntity(),
      data: {
        meadowlark: {
          hasSchoolYear: false,
        },
      },
    };

    let resultChain: MiddlewareModel;
    let mockDocumentValidator: any;

    beforeAll(async () => {
      mockDocumentValidator = jest.spyOn(SchoolYearValidator, 'validateDocument');

      // Act
      resultChain = await schoolYearValidation({ frontendRequest, frontendResponse: null });
    });

    afterAll(() => {
      mockDocumentValidator.mockRestore();
    });

    it('returns the given request', () => {
      expect(resultChain.frontendRequest).toBe(frontendRequest);
    });

    it('does not return a response', () => {
      expect(resultChain.frontendResponse).toBeNull();
    });

    it('never calls validateDocument', () => {
      expect(mockDocumentValidator).not.toHaveBeenCalled();
    });
  });

  describe('given the document contains a valid school year', () => {
    const frontendRequest: FrontendRequest = newFrontendRequest();
    frontendRequest.middleware.matchingMetaEdModel = {
      ...newTopLevelEntity(),
      data: {
        meadowlark: {
          hasSchoolYear: true,
        },
      },
    };
    frontendRequest.middleware.parsedBody = {
      schoolYearReference: {
        schoolYear: 2022,
      },
    };

    let resultChain: MiddlewareModel;
    let mockDocumentValidator: any;

    beforeAll(async () => {
      mockDocumentValidator = jest.spyOn(SchoolYearValidator, 'validateDocument');

      // School year is valid
      mockDocumentValidator.mockReturnValue('');

      // Act
      resultChain = await schoolYearValidation({ frontendRequest, frontendResponse: null });
    });

    afterAll(() => {
      mockDocumentValidator.mockRestore();
    });

    it('returns the given request', () => {
      expect(resultChain.frontendRequest).toBe(frontendRequest);
    });

    it('does not return a response', () => {
      expect(resultChain.frontendResponse).toBeNull();
    });

    it('calls validateDocument', () => {
      expect(mockDocumentValidator).toHaveBeenCalled();
    });
  });

  describe('given the document contains an invalid school year', () => {
    const frontendRequest: FrontendRequest = newFrontendRequest();
    frontendRequest.middleware.matchingMetaEdModel = {
      ...newTopLevelEntity(),
      data: {
        meadowlark: {
          hasSchoolYear: true,
        },
      },
    };
    frontendRequest.middleware.parsedBody = {
      schoolYearReference: {
        schoolYear: 2022,
      },
    };
    frontendRequest.middleware.headerMetadata = {
      a: 'b',
    };

    let resultChain: MiddlewareModel;
    let mockDocumentValidator: any;

    beforeAll(async () => {
      mockDocumentValidator = jest.spyOn(SchoolYearValidator, 'validateDocument');

      // School year is NOT valid
      mockDocumentValidator.mockReturnValue('error message');

      // Act
      resultChain = await schoolYearValidation({ frontendRequest, frontendResponse: null });
    });

    afterAll(() => {
      mockDocumentValidator.mockRestore();
    });

    it('returns the given request', () => {
      expect(resultChain.frontendRequest).toBe(frontendRequest);
    });

    it('returns an error response', () => {
      expect(resultChain.frontendResponse).not.toBeNull();
    });

    it('returns status code 400', () => {
      expect(resultChain.frontendResponse?.statusCode).toBe(400);
    });

    it('returns an error body', () => {
      expect(resultChain.frontendResponse?.body).toBe('error message');
    });

    it('returns the request header metadata', () => {
      expect(resultChain.frontendResponse?.headers).toBe(frontendRequest.middleware.headerMetadata);
    });

    it('calls validateDocument', () => {
      expect(mockDocumentValidator).toHaveBeenCalled();
    });
  });
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as MeadowlarkUtilities from '@edfi/meadowlark-utilities';
import { Logger } from '@edfi/meadowlark-utilities';
import { logTheResponse } from '../../src/middleware/ResponseLoggingMiddleware';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { newFrontendResponse } from '../../src/handler/FrontendResponse';
import { newFrontendRequest } from '../../src/handler/FrontendRequest';
import { setupMockConfiguration } from '../ConfigHelper';
import { TraceId } from '../../src/model/IdTypes';

describe('when logging the response', () => {
  describe('given a success status code', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
      setupMockConfiguration();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it.each([[200], [201], [204]])('does nothing (%s)', async (statusCode: number) => {
      const model: MiddlewareModel = {
        frontendRequest: newFrontendRequest(),
        frontendResponse: {
          ...newFrontendResponse(),
          statusCode,
        },
      };

      await logTheResponse(model);

      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });

  describe('given a resource that does not exist (404)', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
      setupMockConfiguration();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('logs the message body unchanged', async () => {
      const traceId = 'traceId' as TraceId;
      const body = {
        error: 'this is not the real 404 message, but it is the real shape of the response',
      };

      const model: MiddlewareModel = {
        frontendRequest: {
          ...newFrontendRequest(),
          traceId,
        },
        frontendResponse: {
          ...newFrontendResponse(),
          body,
          statusCode: 404,
        },
      };

      await logTheResponse(model);

      expect(loggerSpy).toHaveBeenCalledWith('core.middleware.ResponseLoggingMiddleware.logTheResponse 404', traceId, body);
    });
  });

  describe('given an error status code with no body', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
      setupMockConfiguration();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    // Random assortment of errors as a "representative sample".
    it.each([[400], [401], [500], [502]])('does nothing (%s)', async (statusCode: number) => {
      const model: MiddlewareModel = {
        frontendRequest: newFrontendRequest(),
        frontendResponse: {
          ...newFrontendResponse(),
          statusCode,
          body: undefined,
        },
      };

      await logTheResponse(model);

      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });

  describe('given a 400 with a body indicating missing property', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
      setupMockConfiguration();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('logs the message body unchanged', async () => {
      const traceId = 'traceId' as TraceId;
      const body = JSON.stringify({
        error: [
          {
            message: "{requestBody} must have required property 'contentIdentifier'",
            path: '{requestBody}',
            context: { errorType: 'required' },
          },
        ],
      });

      const model: MiddlewareModel = {
        frontendRequest: {
          ...newFrontendRequest(),
          traceId,
        },
        frontendResponse: {
          ...newFrontendResponse(),
          body,
          statusCode: 400,
        },
      };

      await logTheResponse(model);

      expect(loggerSpy).toHaveBeenCalledWith('core.middleware.ResponseLoggingMiddleware.logTheResponse 400', traceId, {
        error: body,
      });
    });
  });

  describe('given a 400 with a body indicating reference validation problem, not descriptor', () => {
    describe('given logs will be anonymized (default)', () => {
      let loggerSpy: any;

      beforeEach(() => {
        loggerSpy = jest.spyOn(Logger, 'debug');
        jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
        setupMockConfiguration();
      });

      afterAll(() => {
        jest.restoreAllMocks();
      });

      it('anonymizes the payload', async () => {
        const traceId = 'traceId' as TraceId;
        const body = {
          error: {
            message: 'Reference validation failed',
            failures: [
              {
                resourceName: 'Intervention',
                identity: {
                  'educationOrganizationReference.educationOrganizationId': 123,
                  interventionIdentificationCode: '111',
                },
              },
            ],
          },
        };

        // In the expectedBody, the object values have been anonymized
        const expectedBody = {
          error: {
            message: 'Reference validation failed',
            failures: [
              {
                resourceName: 'Intervention',
                identity: {
                  'educationOrganizationReference.educationOrganizationId': '*',
                  interventionIdentificationCode: '*',
                },
              },
            ],
          },
        };

        const model: MiddlewareModel = {
          frontendRequest: {
            ...newFrontendRequest(),
            traceId,
          },
          frontendResponse: {
            ...newFrontendResponse(),
            body,
            statusCode: 400,
          },
        };

        await logTheResponse(model);

        expect(loggerSpy).toHaveBeenCalledWith(
          'core.middleware.ResponseLoggingMiddleware.logTheResponse 400',
          traceId,
          expectedBody,
        );
      });
    });

    describe('given anonymization is disabled', () => {
      let loggerSpy: any;

      beforeEach(() => {
        loggerSpy = jest.spyOn(Logger, 'debug');
        jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
        setupMockConfiguration(true, true);
      });

      afterAll(() => {
        jest.restoreAllMocks();
      });

      it('logs the original payload', async () => {
        const traceId = 'traceId' as TraceId;
        const body = {
          error: {
            message: 'Reference validation failed',
            failures: [
              {
                resourceName: 'Intervention',
                identity: {
                  'educationOrganizationReference.educationOrganizationId': 123,
                  interventionIdentificationCode: '111',
                },
              },
            ],
          },
        };

        const model: MiddlewareModel = {
          frontendRequest: {
            ...newFrontendRequest(),
            traceId,
          },
          frontendResponse: {
            ...newFrontendResponse(),
            body,
            statusCode: 400,
          },
        };

        await logTheResponse(model);

        expect(loggerSpy).toHaveBeenCalledWith(
          'core.middleware.ResponseLoggingMiddleware.logTheResponse 400',
          traceId,
          body,
        );
      });
    });
  });

  describe('given a 400 with a body indicating reference validation problem, with descriptor', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
      setupMockConfiguration();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('logs the message body without anonymization', async () => {
      const traceId = 'traceId' as TraceId;
      const body = {
        error: {
          message: 'Reference validation failed',
          failures: [
            {
              resourceName: 'ContentClassDescriptor',
              identity: {
                descriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
              },
            },
          ],
        },
      };

      const model: MiddlewareModel = {
        frontendRequest: {
          ...newFrontendRequest(),
          traceId,
        },
        frontendResponse: {
          ...newFrontendResponse(),
          body,
          statusCode: 400,
        },
      };

      await logTheResponse(model);

      expect(loggerSpy).toHaveBeenCalledWith('core.middleware.ResponseLoggingMiddleware.logTheResponse 400', traceId, body);
    });
  });
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/*
  "message": "Reference validation failed: Resource ClassPeriod is missing identity {"classPeriodName":"z1","schoolReference.schoolId":66},Resource ClassPeriod is missing identity {"classPeriodName":"z2","schoolReference.schoolId":66},Resource CourseOffering is missing identity {"localCourseCode":"abc","schoolReference.schoolId":666,"sessionReference.schoolId":666,"sessionReference.schoolYear":2034,"sessionReference.sessionName":"d"},Resource Location is missing identity {"classroomIdentificationCode":"1","schoolReference.schoolId":2},Resource CreditTypeDescriptor is missing identity {"descriptor":"k"}"
*/

import * as MeadowlarkUtilities from '@edfi/meadowlark-utilities';
import { Logger } from '@edfi/meadowlark-utilities';
import { logTheResponse } from '../../src/middleware/ResponseLoggingMiddleware';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { newFrontendResponse } from '../../src/handler/FrontendResponse';
import { newFrontendRequest } from '../../src/handler/FrontendRequest';

describe('when logging the response', () => {
  describe('given a success status code', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
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

  describe('given an error status code with no body', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
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
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('logs the message body unchanged', async () => {
      const traceId = 'traceid';
      const body = JSON.stringify({
        message: [
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
        message: body,
      });
    });
  });

  describe('given a 400 with a body indicating reference validation problem, not descriptor', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('anonymizes the payload', async () => {
      const traceId = 'traceId';
      const body = {
        error: {
          '0': {
            resourceName: 'Intervention',
            identity: {
              'educationOrganizationReference.educationOrganizationId': 123,
              interventionIdentificationCode: '111',
            },
          },
          '1': {
            resourceName: 'Student',
            identity: {
              'studentReference.studentUniqueId': 'aaaa',
            },
          },
          message: 'Reference validation failed',
        },
      };

      // In the expectedBody, the object values have been anonymized
      const expectedBody = {
        '0': {
          resourceName: 'Intervention',
          identity: {
            'educationOrganizationReference.educationOrganizationId': '*',
            interventionIdentificationCode: '*',
          },
        },
        '1': {
          resourceName: 'Student',
          identity: {
            'studentReference.studentUniqueId': '*',
          },
        },
        message: 'Reference validation failed',
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

  describe('given a 400 with a body indicating reference validation problem, with descriptor', () => {
    let loggerSpy: any;

    beforeEach(() => {
      loggerSpy = jest.spyOn(Logger, 'debug');
      jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('logs the message body without anonymization', async () => {
      const traceId = 'traceid';
      const body = {
        error: {
          '0': {
            resourceName: 'ContentClassDescriptor',
            identity: {
              descriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
            },
          },
          message: 'Reference validation failed',
        },
      };

      const expectedBody = {
        '0': {
          resourceName: 'ContentClassDescriptor',
          identity: {
            descriptor: 'uri://ed-fi.org/ContentClassDescriptor#Presentation',
          },
        },
        message: 'Reference validation failed',
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
});

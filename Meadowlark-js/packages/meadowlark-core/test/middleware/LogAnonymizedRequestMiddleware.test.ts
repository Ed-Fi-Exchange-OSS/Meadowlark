// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as MeadowlarkUtilities from '@edfi/meadowlark-utilities';
import { Config, Logger } from '@edfi/meadowlark-utilities';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { anonymizeAndLogRequestBody } from '../../src/middleware/LogAnonymizedRequestMiddleware';
import { parseBody } from '../../src/middleware/ParseBodyMiddleware';

const setupMockConfiguration = (isDebug: boolean = false) => {
  jest.spyOn(Config, 'get').mockImplementation((key: Config.ConfigKeys) => {
    switch (key) {
      case 'IS_LOCAL':
        return true;
      case 'LOG_LEVEL':
        return isDebug ? 'DEBUG' : 'ERROR';
      default:
        throw new Error(`Key '${key}' not configured`);
    }
  });

  jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => isDebug);
};

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();

    // Act
    resultChain = await anonymizeAndLogRequestBody({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });
});

describe('given a null response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    setupMockConfiguration();

    // Act
    resultChain = await anonymizeAndLogRequestBody({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a null response', () => {
    expect(resultChain.frontendResponse).toBe(null);
  });
});

describe('flat doc example - given previous middleware has created a response with debug log level', () => {
  let loggerSpy: any;

  beforeAll(() => {
    setupMockConfiguration(true);
    loggerSpy = jest.spyOn(Logger, 'debug');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('An anonymized version of the body is logged', async () => {
    const traceId = 'traceid';

    const body = JSON.stringify({
      studentUniqueId: 'abca123',
      firstName: 'Hello',
      lastSurname: 'World',
      birthDate: '2001-01-01',
      birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#US',
    });

    const model: MiddlewareModel = {
      frontendRequest: {
        ...newFrontendRequest(),
        body,
        traceId,
      },
      frontendResponse: null,
    };

    const resultChain = await parseBody(model);

    await anonymizeAndLogRequestBody(resultChain);

    expect(loggerSpy).toHaveBeenCalledWith('Anonymized request body:', traceId, {
      birthCountryDescriptor: null,
      birthDate: null,
      firstName: null,
      lastSurname: null,
      studentUniqueId: null,
    });
  });
});

describe('nested doc example - given previous middleware has created a response with debug log level', () => {
  let loggerSpy: any;

  beforeAll(() => {
    setupMockConfiguration(true);
    loggerSpy = jest.spyOn(Logger, 'debug');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('An anonymized version of the body is logged', async () => {
    const traceId = 'traceid';

    const body = JSON.stringify({
      studentReference: {
        studentUniqueId: 's0zf6d1123d3e',
      },
      interventionReference: {
        interventionIdentificationCode: '111',
        educationOrganizationId: 123,
      },
    });

    const model: MiddlewareModel = {
      frontendRequest: {
        ...newFrontendRequest(),
        body,
        traceId,
      },
      frontendResponse: null,
    };

    const resultChain = await parseBody(model);

    await anonymizeAndLogRequestBody(resultChain);

    expect(loggerSpy).toHaveBeenCalledWith('Anonymized request body:', traceId, {
      studentReference: {
        studentUniqueId: null,
      },
      interventionReference: {
        interventionIdentificationCode: null,
        educationOrganizationId: null,
      },
    });

    // Don't modify the original on accident
    expect(resultChain.frontendRequest.middleware.parsedBody).toStrictEqual({
      studentReference: {
        studentUniqueId: 's0zf6d1123d3e',
      },
      interventionReference: {
        interventionIdentificationCode: '111',
        educationOrganizationId: 123,
      },
    });
  });
});

describe('given previous middleware has created a response with info log level', () => {
  let loggerSpy: any;

  beforeAll(() => {
    setupMockConfiguration(false);
    loggerSpy = jest.spyOn(Logger, 'debug');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Logger is not called', async () => {
    const traceId = 'traceid';

    const body = JSON.stringify({
      studentUniqueId: 'abca123',
      firstName: 'Hello',
      lastSurname: 'World',
      birthDate: '2001-01-01',
      birthCountryDescriptor: 'uri://ed-fi.org/CountryDescriptor#US',
    });

    const model: MiddlewareModel = {
      frontendRequest: {
        ...newFrontendRequest(),
        body,
        traceId,
      },
      frontendResponse: null,
    };

    const resultChain = await parseBody(model);

    await anonymizeAndLogRequestBody(resultChain);

    expect(loggerSpy).toBeCalledTimes(0);
  });
});

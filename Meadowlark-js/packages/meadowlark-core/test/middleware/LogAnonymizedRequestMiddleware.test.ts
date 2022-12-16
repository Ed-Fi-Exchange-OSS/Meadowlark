// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as MeadowlarkUtilities from '@edfi/meadowlark-utilities';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';
import { anonymizeAndLogRequestBody } from '../../src/middleware/LogAnonymizedRequestMiddleware';
import { parseBody } from '../../src/middleware/ParseBodyMiddleware';
import { newResourceInfo } from '../../src/model/ResourceInfo';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;

  beforeAll(async () => {
    MeadowlarkUtilities.initializeLogging();

    // Act
    resultChain = await anonymizeAndLogRequestBody({ frontendRequest, frontendResponse });
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
    MeadowlarkUtilities.initializeLogging();

    // Act
    resultChain = await anonymizeAndLogRequestBody({ frontendRequest, frontendResponse: null });
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns a null response', () => {
    expect(resultChain.frontendResponse).toBe(null);
  });
});

describe('given previous middleware has created a response with debug log level and is not a descriptor', () => {
  let loggerSpy: any;

  beforeEach(() => {
    loggerSpy = jest.spyOn(MeadowlarkUtilities.Logger, 'debug');
    jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
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

    expect(loggerSpy).toHaveBeenCalledWith(
      `Anonymized request body: {"studentUniqueId":null,"firstName":null,"lastSurname":null,"birthDate":null,"birthCountryDescriptor":null}`,
      traceId,
    );
  });
});

describe('given previous middleware has created a response with info log level and is not a descriptor', () => {
  let loggerSpy: any;

  beforeEach(() => {
    loggerSpy = jest.spyOn(MeadowlarkUtilities.Logger, 'debug');
    jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => false);
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

describe('given previous middleware has created a response with debug log level and is a descriptor', () => {
  let loggerSpy: any;

  beforeEach(() => {
    loggerSpy = jest.spyOn(MeadowlarkUtilities.Logger, 'debug');
    jest.spyOn(MeadowlarkUtilities, 'isDebugEnabled').mockImplementation(() => true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Logger is not called', async () => {
    const traceId = 'traceid';

    const body = JSON.stringify({
      codeValue: 'US',
      shortDescription: 'US',
      namespace: 'uri://ed-fi.org/CountryDescriptor',
    });

    const model: MiddlewareModel = {
      frontendRequest: {
        ...newFrontendRequest(),
        body,
        traceId,
      },
      frontendResponse: null,
    };

    model.frontendRequest.middleware.resourceInfo = newResourceInfo();
    model.frontendRequest.middleware.resourceInfo.isDescriptor = true;

    const resultChain = await parseBody(model);

    await anonymizeAndLogRequestBody(resultChain);

    expect(loggerSpy).toBeCalledTimes(0);
  });
});

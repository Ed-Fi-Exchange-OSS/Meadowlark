// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { newTopLevelEntity, TopLevelEntity } from '@edfi/metaed-core';
import * as MetaEdModelFinder from '../../src/metaed/MetaEdModelFinder';
import { metaEdModelFinding } from '../../src/middleware/FindMetaEdModelMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockDocumentValidator: any;

  beforeAll(async () => {
    mockDocumentValidator = jest.spyOn(MetaEdModelFinder, 'findMetaEdModel');

    // Act
    resultChain = await metaEdModelFinding({ frontendRequest, frontendResponse });
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

  it('never calls metaEdModelFinding', () => {
    expect(mockDocumentValidator).not.toHaveBeenCalled();
  });
});

describe('given a no match response from findMetaEdModel', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;
  let mockDocumentValidator: any;

  beforeAll(async () => {
    mockDocumentValidator = jest.spyOn(MetaEdModelFinder, 'findMetaEdModel').mockReturnValue(Promise.resolve(undefined));

    // Act
    resultChain = await metaEdModelFinding({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockDocumentValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 500', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(500);
  });

  it('returns an empty body', () => {
    expect(resultChain.frontendResponse?.body).toBeUndefined();
  });
});

describe('given a match response from findMetaEdModel', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const topLevelEntity: TopLevelEntity = newTopLevelEntity();
  const headerMetadata = {};
  let resultChain: MiddlewareModel;
  let mockDocumentValidator: any;

  beforeAll(async () => {
    mockDocumentValidator = jest
      .spyOn(MetaEdModelFinder, 'findMetaEdModel')
      .mockReturnValue(Promise.resolve(topLevelEntity));

    // Act
    resultChain = await metaEdModelFinding({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockDocumentValidator.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds matchingMetaEdModel to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.matchingMetaEdModel).toBe(topLevelEntity);
  });

  it('adds headerMetadata to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.headerMetadata).toEqual(headerMetadata);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as BuildDocumentInfo from '../../src/extraction/BuildDocumentInfo';
import { documentInfoExtraction } from '../../src/middleware/ExtractDocumentInfoMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { newDocumentInfo, NoDocumentInfo } from '../../src/model/DocumentInfo';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockDocumentInfoBuilder: any;

  beforeAll(async () => {
    mockDocumentInfoBuilder = jest.spyOn(BuildDocumentInfo, 'buildDocumentInfo');

    // Act
    resultChain = await documentInfoExtraction({ frontendRequest, frontendResponse });
  });

  afterAll(() => {
    mockDocumentInfoBuilder.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns the given response', () => {
    expect(resultChain.frontendResponse).toBe(frontendResponse);
  });

  it('never calls documentInfoExtraction', () => {
    expect(mockDocumentInfoBuilder).not.toHaveBeenCalled();
  });
});

describe('given a no document info response from extractDocumentInfo', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;
  let mockDocumentInfoBuilder: any;

  beforeAll(async () => {
    mockDocumentInfoBuilder = jest.spyOn(BuildDocumentInfo, 'buildDocumentInfo').mockImplementation(() => NoDocumentInfo);

    // Act
    resultChain = await documentInfoExtraction({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockDocumentInfoBuilder.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('returns status 404', () => {
    expect(resultChain.frontendResponse?.statusCode).toEqual(404);
  });

  it('returns an empty body', () => {
    expect(resultChain.frontendResponse?.body).toBeUndefined();
  });
});

describe('given a document info response from extractDocumentInfo', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const documentInfo = newDocumentInfo();
  const headerMetadata = {};
  let resultChain: MiddlewareModel;
  let mockDocumentInfoBuilder: any;

  beforeAll(async () => {
    mockDocumentInfoBuilder = jest.spyOn(BuildDocumentInfo, 'buildDocumentInfo').mockImplementation(() => documentInfo);

    // Act
    resultChain = await documentInfoExtraction({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockDocumentInfoBuilder.mockRestore();
  });

  it('returns the given request', () => {
    expect(resultChain.frontendRequest).toBe(frontendRequest);
  });

  it('adds documentInfo to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.documentInfo).toBe(documentInfo);
  });

  it('adds headerMetadata to frontendRequest', () => {
    expect(resultChain.frontendRequest.middleware.headerMetadata).toEqual(headerMetadata);
  });

  it('does not create a response', () => {
    expect(resultChain.frontendResponse).toBeNull();
  });
});

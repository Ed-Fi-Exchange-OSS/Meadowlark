// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as DocumentInfoExtractor from '../../src/extraction/DocumentInfoExtractor';
import { documentInfoExtraction } from '../../src/middleware/ExtractDocumentInfoMiddleware';
import { FrontendResponse, newFrontendResponse } from '../../src/handler/FrontendResponse';
import { FrontendRequest, newFrontendRequest } from '../../src/handler/FrontendRequest';
import { DocumentInfo, newDocumentInfo, NoDocumentInfo } from '../../src/model/DocumentInfo';
import { MiddlewareModel } from '../../src/middleware/MiddlewareModel';

describe('given a previous middleware has created a response', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  const frontendResponse: FrontendResponse = newFrontendResponse();
  let resultChain: MiddlewareModel;
  let mockDocumentValidator: any;

  beforeAll(async () => {
    mockDocumentValidator = jest.spyOn(DocumentInfoExtractor, 'extractDocumentInfo');

    // Act
    resultChain = await documentInfoExtraction({ frontendRequest, frontendResponse });
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

  it('never calls documentInfoExtraction', () => {
    expect(mockDocumentValidator).not.toHaveBeenCalled();
  });
});

describe('given a no document info response from extractDocumentInfo', () => {
  const frontendRequest: FrontendRequest = newFrontendRequest();
  let resultChain: MiddlewareModel;
  let mockDocumentValidator: any;

  beforeAll(async () => {
    const validationResult: DocumentInfo = NoDocumentInfo;

    mockDocumentValidator = jest
      .spyOn(DocumentInfoExtractor, 'extractDocumentInfo')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await documentInfoExtraction({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockDocumentValidator.mockRestore();
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
  let mockDocumentValidator: any;

  beforeAll(async () => {
    const validationResult = documentInfo;

    mockDocumentValidator = jest
      .spyOn(DocumentInfoExtractor, 'extractDocumentInfo')
      .mockReturnValue(Promise.resolve(validationResult));

    // Act
    resultChain = await documentInfoExtraction({ frontendRequest, frontendResponse: null });
  });

  afterAll(() => {
    mockDocumentValidator.mockRestore();
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

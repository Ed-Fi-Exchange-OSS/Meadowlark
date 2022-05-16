// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import type { FrontendRequest, FrontendResponse } from '@edfi/meadowlark-core';

export function fromRequest(event: APIGatewayProxyEvent, context: Context): FrontendRequest {
  return {
    path: event.path ?? '',
    traceId: context.awsRequestId ?? '',
    body: event.body,
    headers: event.headers ?? {},
    pathParameters: event.pathParameters ?? {},
    queryStringParameters: event.queryStringParameters ?? {},
    stage: event.requestContext.stage,
  };
}

export function respondWith(frontendResponse: FrontendResponse): APIGatewayProxyResult {
  return frontendResponse;
}

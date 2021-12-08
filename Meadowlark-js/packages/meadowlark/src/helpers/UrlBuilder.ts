// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { APIGatewayProxyEvent } from 'aws-lambda';

const getHttpProtocol = (stage: string): string => (stage === 'local' ? 'http' : 'https');

/*
 * Rebuilds the base URL for the request. Assumes that everything running in the
 * "local" stage is using HTTP, and anything else is using HTTPS.
 */
export const buildBaseUrlFromRequest = (event: APIGatewayProxyEvent): string => {
  const { stage } = event.requestContext;
  const protocol = getHttpProtocol(stage);
  return `${protocol}://${event.headers.Host}/${stage}`;
};

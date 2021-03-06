// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { initializeLogging, oauthHandler } from '@edfi/meadowlark-core';
import { respondWith, fromRequest } from './MeadowlarkConverter';

initializeLogging();

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await oauthHandler(fromRequest(event, context)));
}

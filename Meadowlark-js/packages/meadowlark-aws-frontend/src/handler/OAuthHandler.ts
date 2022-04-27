// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as Meadowlark from '@edfi/meadowlark-core';

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.oauthHandler(event, context);
}

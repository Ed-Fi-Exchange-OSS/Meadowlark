// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  update as meadowlarkUpdate,
  upsert as meadowlarkUpsert,
  getResolver as meadowlarkGet,
  deleteIt as meadowlarkDelete,
} from '@edfi/meadowlark-core';
import { respondWith, fromRequest } from './MeadowlarkConverter';

/**
 * Entry point for API POST requests
 */
export async function upsert(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await meadowlarkUpsert(fromRequest(event, context, 'POST')));
}

/**
 * Entry point for all API GET requests
 */
export async function getResolver(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await meadowlarkGet(fromRequest(event, context, 'GET')));
}

/**
 * Entry point for all API PUT requests, which are "by id"
 */
export async function update(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await meadowlarkUpdate(fromRequest(event, context, 'PUT')));
}

/**
 * Entry point for all API DELETE requests, which are "by id"
 */
export async function deleteIt(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await meadowlarkDelete(fromRequest(event, context, 'DELETE')));
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as Meadowlark from '@edfi/meadowlark-core';

/**
 * Entry point for API POST requests
 *
 * Validates resource and JSON document shape, extracts keys and forwards to DynamoRepository for creation
 */
export async function create(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.create(event, context);
}

/**
 * Entry point for all API GET requests
 *
 * Determines whether request is "get all", "get by id", or a query, and forwards to the appropriate handler
 */
export async function getResolver(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.getResolver(event, context);
}

/**
 * Entry point for all API PUT requests, which are "by id"
 *
 * Validates resource and JSON document shape, extracts keys and forwards to DynamoRepository for update
 */
export async function update(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.update(event, context);
}

/**
 * Entry point for all API DELETE requests, which are "by id"
 *
 * Validates resource and forwards to DynamoRepository for deletion
 */
export async function deleteIt(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.deleteIt(event, context);
}

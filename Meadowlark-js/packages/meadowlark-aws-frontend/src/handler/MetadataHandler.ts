// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as Meadowlark from '@edfi/meadowlark-core';

/**
 * An http handler for the metadata endpoint used for diagnostics. Loads the requested MetaEd
 * project and returns MetaEd project metadata in the response header.
 */
export async function metaed(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.metaed(event, context);
}

/**
 * Base endpoint that returns the DS version and supported extensions
 */
export async function apiVersion(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.apiVersion(event, context);
}

/**
 * Endpoint for accessing Resources API swagger metadata
 */
export async function swaggerForResourcesAPI(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.swaggerForResourcesAPI(event, context);
}

/*
 * Endpoint for listing available Open API metadata descriptions
 */
export async function openApiUrlList(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return Meadowlark.openApiUrlList(event, context);
}

/**
 * Endpoint for accessing Descriptors API swagger metadata
 */
export async function swaggerForDescriptorsAPI(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  return Meadowlark.swaggerForDescriptorsAPI(event, context);
}

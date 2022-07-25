// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as Meadowlark from '@edfi/meadowlark-core';
import { initializeLogging } from '@edfi/meadowlark-core';
import { respondWith, fromRequest } from './MeadowlarkConverter';

initializeLogging();

/**
 * An http handler for the metadata endpoint used for diagnostics. Loads the requested MetaEd
 * project and returns MetaEd project metadata in the response header.
 */
export async function metaed(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await Meadowlark.metaed(fromRequest(event, context)));
}

/**
 * Base endpoint that returns the DS version and supported extensions
 */
export async function apiVersion(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await Meadowlark.apiVersion(fromRequest(event, context)));
}

/**
 * Endpoint for accessing Resources API swagger metadata
 */
export async function swaggerForResourcesAPI(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await Meadowlark.swaggerForResourcesAPI(fromRequest(event, context)));
}

/*
 * Endpoint for listing available Open API metadata descriptions
 */
export async function openApiUrlList(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await Meadowlark.openApiUrlList(fromRequest(event, context)));
}

/**
 * Endpoint for accessing Descriptors API swagger metadata
 */
export async function swaggerForDescriptorsAPI(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  return respondWith(await Meadowlark.swaggerForDescriptorsAPI(fromRequest(event, context)));
}

/**
 * Endpoint for accessing Dependencies JSON file
 */
export async function dependencies(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  return respondWith(await Meadowlark.dependencies(fromRequest(event, context)));
}

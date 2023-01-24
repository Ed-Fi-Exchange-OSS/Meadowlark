// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* istanbul ignore file */
import * as Meadowlark from '@edfi/meadowlark-core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { respondWith, fromRequest } from './MeadowlarkConverter';

/**
 * An http handler for the metadata endpoint used for diagnostics. Loads the requested MetaEd
 * project and returns MetaEd project metadata in the response header.
 */
export async function metaed(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await Meadowlark.metaed(fromRequest(request)), reply);
}

/**
 * Base endpoint that returns the DS version and supported extensions
 */
export async function apiVersion(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await Meadowlark.apiVersion(fromRequest(request)), reply);
}

/**
 * Endpoint for accessing Resources API swagger metadata
 */
export async function swaggerForResourcesAPI(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await Meadowlark.swaggerForResourcesAPI(fromRequest(request)), reply);
}

/*
 * Endpoint for listing available Open API metadata descriptions
 */
export async function openApiUrlList(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await Meadowlark.openApiUrlList(fromRequest(request)), reply);
}

/**
 * Endpoint for accessing Descriptors API swagger metadata
 */
export async function swaggerForDescriptorsAPI(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  return respondWith(await Meadowlark.swaggerForDescriptorsAPI(fromRequest(request)), reply);
}

/**
 * Endpoint for accessing Dependencies JSON file
 */
export async function dependencies(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  return respondWith(await Meadowlark.dependencies(fromRequest(request)), reply);
}

export async function xsdMetadata(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  return respondWith(await Meadowlark.xsdMetadata(fromRequest(request)), reply);
}

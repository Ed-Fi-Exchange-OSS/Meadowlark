// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import axios from 'axios';
import { Namespace } from '@edfi/metaed-core';

import { Logger } from '../helpers/Logger';
import { loadMetaEdState } from '../metaed/LoadMetaEd';
import { modelPackageFor } from '../metaed/MetaEdProjectMetadata';
import { CreateApiVersionObject, OpenApiListTemplate } from './MetadataResources';
import { Constants } from '../Constants';
import { getValueFromEnvironment } from '../Environment';
import { buildBaseUrlFromRequest } from '../helpers/UrlBuilder';

interface ExternalResource {
  body: string;
  etag: string;
}
export const resourceCache: { [key: string]: ExternalResource } = {};

function writeRequestToLog(event: APIGatewayProxyEvent, context: Context, method: string): void {
  Logger.info(`MetadataHandler.${method} ${event.path}`, context.awsRequestId, event.requestContext.requestId);
}

function writeDebugStatusToLog(context: Context, method: string, message?: string, status?: number): void {
  Logger.debug(`MetadataHandler.${method} ${status} ${message || ''}`.trimEnd(), context.awsRequestId);
}

function writeErrorToLog(context: Context, event: APIGatewayProxyEvent, method: string, status: number, error?: any): void {
  Logger.error(`MetadataHandler.${method} ${status}`, context.awsRequestId, event.requestContext.requestId, error);
}

/**
 * An http handler for the metadata endpoint used for diagnostics. Loads the requested MetaEd
 * project and returns MetaEd project metadata in the response header.
 */
export async function metaed(event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> {
  if (event.pathParameters?.projectAbbreviation == null) return { body: '', statusCode: 400 };
  const modelNpmPackage = modelPackageFor(event.pathParameters.projectAbbreviation);
  const { metaEd, metaEdConfiguration } = await loadMetaEdState(modelNpmPackage);

  const { entity, projectName, projectVersion } = metaEd.namespace.get('EdFi') as Namespace;
  const common: string[] = Array.from(entity.common.values()).map((x) => x.metaEdName);
  const descriptor: string[] = Array.from(entity.descriptor.values()).map((x) => x.metaEdName);
  const domainEntity: string[] = Array.from(entity.domainEntity.values()).map((x) => x.metaEdName);
  return {
    body: JSON.stringify({ projectName, projectVersion, common, descriptor, domainEntity }),
    statusCode: 200,
    headers: {
      'X-MetaEd-Project-Name': metaEdConfiguration.projects[0].projectName,
      'X-MetaEd-Project-Version': metaEdConfiguration.projects[0].projectVersion,
      'X-MetaEd-Project-Package-Name': modelNpmPackage,
      'Access-Control-Allow-Origin': '*',
    },
  };
}

/**
 * Base endpoint that returns the DS version and supported extensions
 */
export async function apiVersion(event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> {
  const baseUrl = buildBaseUrlFromRequest(event);
  return {
    body: CreateApiVersionObject(baseUrl),
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };
}

/**
 * Internal function for compiling the swagger template into a response body
 */
function useTemplate(data: string, host: string, stage: string): string {
  // Originally, this functionality used handlebars. We need to inject
  // the schemes with quotation marks that won't be encoded, but when
  // we do so, handlebars ends up escaping every quotation mark.
  // Just use a straight string replacement without handlebars.
  const basePath = `/${stage}/${Constants.version33b}/`;
  const basePathToken = /{{ basePath }}/g;

  const tokenUrl = getValueFromEnvironment('TOKEN_URL');
  const tokenUrlToken = /{{ tokenUrl }}/g;

  const hostToken = /{{ host }}/g;

  const schemes = stage === 'local' ? '"http"' : '"https"';
  const schemesToken = /{{{ schemes }}}/g;

  return data
    .replace(basePathToken, basePath)
    .replace(tokenUrlToken, tokenUrl)
    .replace(hostToken, host)
    .replace(schemesToken, schemes);
}

/*
 * Retrieves and caches a swagger specification from an external URL.
 */
async function getSwaggerSpecification(
  url: string,
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const resource = url in resourceCache ? resourceCache[url] : { body: '', etag: '' };

  try {
    writeDebugStatusToLog(context, 'getSwaggerSpecification', `getting ${url}`);
    const response = await axios.get(url, {
      headers: { 'If-None-Match': resource.etag },
      validateStatus(status) {
        return status === 200 /* new contents */ || status === 304 /* no changes */;
      },
    });

    if (response.status === 200) {
      writeDebugStatusToLog(context, 'getSwaggerSpecification', '200 from AWS');
      resource.etag = response.headers.etag;
      resource.body = useTemplate(response.data, event.headers?.Host || '', event.requestContext.stage);

      resourceCache[url] = resource;
    } else {
      writeDebugStatusToLog(context, 'getSwaggerSpecification', '304 from AWS');
    }

    return {
      body: resource.body,
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    writeErrorToLog(context, event, 'getSwaggerSpecification', 404, error);
    return {
      body: '',
      statusCode: 404,
    };
  }
}

/**
 * Endpoint for accessing Resources API swagger metadata
 */
export async function swaggerForResourcesAPI(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  writeRequestToLog(event, context, 'swaggerForResourcesAPI');
  // For now, we are serving a (nearly) static JSON file extracted from the real
  // ODS/API 5.3. This file is > 2 MB even when minified. Instead of keeping it
  // in the source code repository, it is being stored in S3.
  return getSwaggerSpecification(Constants.swaggerResourceUrl, event, context);
}

/*
 * Endpoint for listing available Open API metadata descriptions
 */
export async function openApiUrlList(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  writeRequestToLog(event, context, 'openApiUrlList');

  const baseUrl = buildBaseUrlFromRequest(event);
  const baseUrlToken = /{{ baseUrl }}/g;

  return {
    body: OpenApiListTemplate.replace(baseUrlToken, baseUrl),
    statusCode: 200,
  };
}

/**
 * Endpoint for accessing Descriptors API swagger metadata
 */
export async function swaggerForDescriptorsAPI(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  writeRequestToLog(event, context, 'swaggerForDescriptorsAPI');
  return getSwaggerSpecification(Constants.swaggerDescriptorUrl, event, context);
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import axios from 'axios';
import { Namespace } from '@edfi/metaed-core';

import { Logger } from '../Logger';
import { loadMetaEdState } from '../metaed/LoadMetaEd';
import { modelPackageFor } from '../metaed/MetaEdProjectMetadata';
import { CreateApiVersionObject, OpenApiListTemplate } from './MetadataResources';
import { Constants } from '../Constants';
import { getValueFromEnvironment } from '../Environment';
import { buildBaseUrlFromRequest } from './UrlBuilder';
import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

interface ExternalResource {
  body: string;
  etag: string;
}
export const resourceCache: { [key: string]: ExternalResource } = {};

function writeRequestToLog(frontendRequest: FrontendRequest, method: string): void {
  Logger.info(`MetadataHandler.${method} ${frontendRequest.path}`, frontendRequest.traceId);
}

function writeDebugStatusToLog(frontendRequest: FrontendRequest, method: string, message?: string, status?: number): void {
  Logger.debug(`MetadataHandler.${method} ${status} ${message || ''}`.trimEnd(), frontendRequest.traceId);
}

function writeErrorToLog(frontendRequest: FrontendRequest, method: string, status: number, error?: any): void {
  Logger.error(`MetadataHandler.${method} ${status}`, frontendRequest.traceId, error);
}

/**
 * An http handler for the metadata endpoint used for diagnostics. Loads the requested MetaEd
 * project and returns MetaEd project metadata in the response header.
 */
export async function metaed(_frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  const modelNpmPackage = modelPackageFor(Constants.version33b);
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
export async function apiVersion(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  const baseUrl = buildBaseUrlFromRequest(frontendRequest);
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
type Transformer = (data: any) => string;

async function getFileFromBlobStorage(
  url: string,
  frontendRequest: FrontendRequest,
  transformer: Transformer,
): Promise<FrontendResponse> {
  const resource = url in resourceCache ? resourceCache[url] : { body: '', etag: '' };

  try {
    writeDebugStatusToLog(frontendRequest, 'getFileFromBlobStorage', `getting ${url}`);
    const response = await axios.get(url, {
      headers: { 'If-None-Match': resource.etag },
      validateStatus(status) {
        return status === 200 /* new contents */ || status === 304 /* no changes */;
      },
    });

    if (response.status === 200) {
      writeDebugStatusToLog(frontendRequest, 'getFileFromBlobStorage', '200 from AWS');
      resource.etag = response.headers.etag;
      resource.body = transformer(response.data);

      resourceCache[url] = resource;
    } else {
      writeDebugStatusToLog(frontendRequest, 'getFileFromBlobStorage', '304 from AWS');
    }

    return {
      body: resource.body,
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    writeErrorToLog(frontendRequest, 'getFileFromBlobStorage', 404, error);
    return {
      body: '',
      statusCode: 404,
    };
  }
}
/*
 * Retrieves and caches a swagger specification from an external URL.
 */
async function getSwaggerSpecification(url: string, frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  return getFileFromBlobStorage(url, frontendRequest, (data: any) =>
    useTemplate(data, frontendRequest.headers?.Host || '', frontendRequest.stage),
  );
}

/**
 * Endpoint for accessing Resources API swagger metadata
 */
export async function swaggerForResourcesAPI(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  writeRequestToLog(frontendRequest, 'swaggerForResourcesAPI');
  // For now, we are serving a (nearly) static JSON file extracted from the real
  // ODS/API 5.3. This file is > 2 MB even when minified. Instead of keeping it
  // in the source code repository, it is being stored in S3.
  return getSwaggerSpecification(Constants.swaggerResourceUrl, frontendRequest);
}

/*
 * Endpoint for listing available Open API metadata descriptions
 */
export async function openApiUrlList(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  writeRequestToLog(frontendRequest, 'openApiUrlList');

  const baseUrl = buildBaseUrlFromRequest(frontendRequest);
  const baseUrlToken = /{{ baseUrl }}/g;

  return {
    body: OpenApiListTemplate.replace(baseUrlToken, baseUrl),
    statusCode: 200,
  };
}

/**
 * Endpoint for accessing Descriptors API swagger metadata
 */
export async function swaggerForDescriptorsAPI(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  writeRequestToLog(frontendRequest, 'swaggerForDescriptorsAPI');
  return getSwaggerSpecification(Constants.swaggerDescriptorUrl, frontendRequest);
}

/**
 * Endpoint for accessing the dependencies JSON file
 */
export async function dependencies(frontendRequest: FrontendRequest): Promise<FrontendResponse> {
  writeRequestToLog(frontendRequest, 'dependencies');
  return getFileFromBlobStorage(Constants.dependenciesUrl, frontendRequest, (data: any) => data);
}

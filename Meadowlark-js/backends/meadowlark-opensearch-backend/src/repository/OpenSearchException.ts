// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { OpenSearchClientError, ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { Logger } from '@edfi/meadowlark-utilities';
import { QueryResult } from '@edfi/meadowlark-core';

export async function handleOpenSearchError(
  err: OpenSearchClientError | Error,
  moduleName: string = '',
  traceId: string = '',
  openSearchRequestId: string = '',
): Promise<QueryResult> {
  try {
    const openSearchClientError = err as OpenSearchClientError;
    const documentProcessError = `OpenSearch Error${
      openSearchRequestId ? ` processing the object '${openSearchRequestId}'` : ''
    }:`;
    if (openSearchClientError?.name !== undefined) {
      switch (openSearchClientError.name) {
        case 'ConfigurationError':
        case 'ConnectionError':
        case 'RequestAbortedError':
        case 'TimeoutError': {
          if (openSearchClientError?.message !== undefined) {
            Logger.error(
              `${moduleName} ${documentProcessError}`,
              traceId,
              `(${openSearchClientError.name}) - ${openSearchClientError.message}`,
            );
            return {
              response: 'QUERY_FAILURE_CONNECTION_ERROR',
              documents: [],
              failureMessage: openSearchClientError.message,
            };
          }
          break;
        }
        case 'ResponseError': {
          const responseException = err as ResponseError;
          if (responseException?.message !== undefined) {
            if (responseException.message !== 'Response Error') {
              if (responseException?.message.indexOf('index_not_found_exception') !== -1) {
                Logger.warn(`${moduleName} ${documentProcessError} index not found`, traceId);
                return {
                  response: 'QUERY_FAILURE_INDEX_NOT_FOUND',
                  documents: [],
                  failureMessage: 'IndexNotFoundException',
                };
              }
              Logger.error(
                `${moduleName} ${documentProcessError}`,
                traceId,
                `(${openSearchClientError.name}) - ${openSearchClientError.message}`,
              );
              return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [], failureMessage: responseException.message };
            }
            if (responseException?.body !== undefined) {
              let responseBody = JSON.parse(responseException?.body?.toString());
              if (responseBody?.error?.type !== undefined) {
                switch (responseBody?.error?.type) {
                  case 'IndexNotFoundException':
                    // No object has been uploaded for the requested type
                    Logger.warn(`${moduleName} ${documentProcessError} index not found`, traceId);
                    return {
                      response: 'QUERY_FAILURE_INDEX_NOT_FOUND',
                      documents: [],
                      failureMessage: 'IndexNotFoundException',
                    };
                  case 'SemanticAnalysisException':
                    // The query term is invalid
                    Logger.error(
                      `${moduleName} ${documentProcessError} invalid query terms`,
                      traceId,
                      `(${openSearchClientError.name}) - ${responseBody?.error?.reason}`,
                    );
                    return {
                      response: 'QUERY_FAILURE_INVALID_QUERY',
                      documents: [],
                      failureMessage: responseBody?.error?.details,
                    };
                  default:
                    Logger.error(`${moduleName} ${documentProcessError}`, traceId, responseBody ?? err);
                    return { response: 'UNKNOWN_FAILURE', documents: [], failureMessage: responseBody };
                }
              } else {
                responseBody = JSON.parse(JSON.stringify(responseException.body));
                Logger.error(`${moduleName} ${documentProcessError}`, traceId, responseBody ?? err);
                return { response: 'UNKNOWN_FAILURE', documents: [], failureMessage: responseBody };
              }
            }
          }
          break;
        }
        case 'DeserializationError':
        case 'NoLivingConnectionsError':
        case 'NotCompatibleError':
        case 'OpenSearchClientError':
        case 'SerializationError':
        default: {
          break;
        }
      }
    }
    Logger.error(`${moduleName} UNKNOWN_FAILURE`, traceId, err);
    return { response: 'UNKNOWN_FAILURE', documents: [], failureMessage: err.message };
  } catch {
    Logger.error(`${moduleName} UNKNOWN_FAILURE`, traceId, err);
    return { response: 'UNKNOWN_FAILURE', documents: [], failureMessage: err.message };
  }
}

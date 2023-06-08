// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { Logger } from '@edfi/meadowlark-utilities';
import { QueryResult } from '@edfi/meadowlark-core';
import { ErrorSearch, ResponseErrorSearch } from './ErrorSearchTypes';

export async function handleSearchError(
  err: ErrorSearch | Error,
  moduleName: string = '',
  traceId: string = '',
  searchRequestId: string = '',
): Promise<QueryResult> {
  try {
    const openSearchClientError = err as ErrorSearch;
    const documentProcessError = `Search Error${searchRequestId ? ` processing the object '${searchRequestId}'` : ''}:`;
    if (openSearchClientError?.name !== undefined) {
      switch (openSearchClientError.name) {
        case 'ConfigurationError':
        case 'ConnectionError':
        case 'DeserializationError':
        case 'NoLivingConnectionsError':
        case 'NotCompatibleError':
        case 'OpenSearchClientError':
        case 'RequestAbortedError':
        case 'SerializationError':
        case 'TimeoutError': {
          if (openSearchClientError?.message !== undefined) {
            Logger.error(
              `${moduleName} ${documentProcessError}`,
              traceId,
              `(${openSearchClientError.name}) - ${openSearchClientError.message}`,
            );
            return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [], failureMessage: openSearchClientError.message };
          }
          break;
        }
        case 'ResponseError': {
          const responseException = err as ResponseErrorSearch;
          if (responseException?.message !== undefined) {
            if (responseException.message !== 'Response Error') {
              let startPosition = responseException?.message?.indexOf('Reason:');
              const position = responseException?.message?.indexOf(' Preview');
              startPosition = startPosition > -1 ? startPosition : 0;
              if (position > -1) {
                responseException.message = responseException?.message?.substring(startPosition, position);
              } else if (startPosition !== 0) {
                responseException.message = responseException?.message?.substring(startPosition);
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
                      response: 'QUERY_FAILURE_INVALID_QUERY',
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

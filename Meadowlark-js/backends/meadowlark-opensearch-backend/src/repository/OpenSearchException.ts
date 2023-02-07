// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { OpenSearchClientError, ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { Logger } from '@edfi/meadowlark-utilities';
import { QueryResult } from '@edfi/meadowlark-core';

export async function LogOpenSearchErrors(
  err: object,
  moduleName: string = '',
  traceId: string = '',
  openSearchRequestId: string = '',
): Promise<QueryResult> {
  const openSearchClientError = err as OpenSearchClientError;
  const documentProcessError = `OpenSearch Error${
    openSearchRequestId ? ` processing the object '${openSearchRequestId}'` : ''
  }:`;
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
          Logger.debug(`${moduleName} ${documentProcessError}`, traceId, openSearchClientError.message);
          return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [], failureMessage: openSearchClientError.message };
        }
        break;
      }
      case 'ResponseError': {
        const responseException = err as ResponseError;
        if (responseException?.message !== undefined) {
          if (responseException.message !== 'Response Error') {
            let startPosition = responseException?.message?.indexOf('Reason:');
            const position = responseException?.message?.indexOf(' Preview');
            startPosition = startPosition > -1 ? startPosition : 0;
            if (position > -1) {
              responseException.message = responseException?.message?.substring(startPosition, position);
            }
            Logger.debug(`${moduleName} ${documentProcessError}`, traceId, openSearchClientError.message);
            return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [], failureMessage: responseException.message };
          }
          if (responseException?.body !== undefined) {
            const responseBody = JSON.parse(responseException.body.toString());
            switch (responseBody?.error?.type) {
              case 'IndexNotFoundException':
                // No object has been uploaded for the requested type
                Logger.debug(`${moduleName} ${documentProcessError} index not found`, traceId, responseBody.error.reason);
                return { response: 'QUERY_FAILURE_INVALID_QUERY', documents: [] };
              case 'SemanticAnalysisException':
                // The query term is invalid
                Logger.debug(
                  `${moduleName} ${documentProcessError} invalid query terms`,
                  traceId,
                  responseBody?.error?.reason,
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
          }
        }
        break;
      }
      default: {
        break;
      }
    }
  }
  throw err;
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Config } from '@edfi/meadowlark-utilities';
import * as R from 'ramda';
import { writeDebugObject } from '../Logger';
import { MissingIdentity } from '../model/DocumentIdentity';
import { MiddlewareModel } from './MiddlewareModel';

const moduleName = 'core.middleware.ResponseLoggingMiddleware';

type ReferenceError = {
  error: {
    message: string;
    failures: MissingIdentity[];
  };
};

export async function logTheResponse({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  if ((frontendResponse?.statusCode ?? 500) >= 400 && frontendResponse?.body != null) {
    // There are several error message formats. We need to anonymize those that are like the ReferenceError type.
    // TypeScript alone doesn't isolate this - need runtime code to detect if the body is in the specific shape.

    const responseBody = R.clone(frontendResponse?.body);

    if (!Config.get('DISABLE_LOG_ANONYMIZATION')) {
      if (
        frontendResponse != null &&
        frontendResponse.body != null &&
        // eslint-disable-next-line dot-notation
        frontendResponse.body['error'] != null &&
        // eslint-disable-next-line dot-notation
        frontendResponse.body['error']['failures'] != null
      ) {
        const anonymizedBody = responseBody as ReferenceError;

        // On a 404, we have a body.error that is just a string. Otherwise, body.error is an object and we want to anonymize
        // and data values in it.
        const notADescriptor = (x: MissingIdentity): boolean => !x.resourceName.endsWith('Descriptor');

        anonymizedBody.error.failures.forEach((failure) => {
          // Anonymize values for non-Descriptors
          if (notADescriptor(failure)) {
            Object.keys(failure.identity).forEach((identityKey) => {
              failure.identity[identityKey] = '*';
            });
          }
        });
      }
    }

    writeDebugObject(
      moduleName,
      frontendRequest,
      'logTheResponse',
      frontendResponse?.statusCode,
      R.is(String, responseBody) ? { error: responseBody } : responseBody,
    );
  }

  return { frontendRequest, frontendResponse };
}

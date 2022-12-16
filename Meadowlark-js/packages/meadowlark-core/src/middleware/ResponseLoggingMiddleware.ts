// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

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
    if (R.is(String, frontendResponse.body)) {
      writeDebugObject(moduleName, frontendRequest, 'logTheResponse', frontendResponse?.statusCode, {
        message: frontendResponse?.body,
      });
    } else {
      const body = R.clone(frontendResponse?.body as ReferenceError);

      const notADescriptor = (x: MissingIdentity): boolean => !x.resourceName.endsWith('Descriptor');

      body.error.failures.forEach((failure) => {
        // Anonymize values for non-Descriptors
        if (notADescriptor(failure)) {
          Object.keys(failure.identity).forEach((identityKey) => {
            failure.identity[identityKey] = '*';
          });
        }

        writeDebugObject(moduleName, frontendRequest, 'logTheResponse', frontendResponse?.statusCode, body);
      });
    }
  }

  return { frontendRequest, frontendResponse };
}

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
    [key: 'message' | string]: string | MissingIdentity;
  };
};

export async function logTheResponse({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  if ((frontendResponse?.statusCode ?? 500) >= 400 && frontendResponse?.body != null) {
    if (R.is(String, frontendResponse.body)) {
      writeDebugObject(moduleName, frontendRequest, 'logTheResponse', frontendResponse?.statusCode, {
        message: frontendResponse?.body,
      });
    } else {
      const body = R.clone((frontendResponse?.body as ReferenceError).error);

      const notADescriptor = (x: MissingIdentity): boolean => !x.resourceName.endsWith('Descriptor');

      Object.keys(body).forEach((key) => {
        // Skip the error message
        if (key === 'message') return;

        const identity = body[key] as MissingIdentity;

        // Anonymize values for non-Descriptors
        if (notADescriptor(identity)) {
          Object.keys(identity.identity).forEach((identityKey) => {
            identity.identity[identityKey] = '*';
          });
        }

        writeDebugObject(moduleName, frontendRequest, 'logTheResponse', frontendResponse?.statusCode, body);
      });
    }
  }

  return { frontendRequest, frontendResponse };
}

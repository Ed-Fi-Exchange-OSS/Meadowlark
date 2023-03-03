// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import * as R from 'ramda';

import { Config, isDebugEnabled, Logger } from '@edfi/meadowlark-utilities';
import { MiddlewareModel } from './MiddlewareModel';

function anonymizeObject(object: Object): Object {
  Object.keys(object).forEach((key) => {
    if (R.is(Object, object[key])) {
      object[key] = anonymizeObject({ ...object[key] });
    } else {
      object[key] = null;
    }
  });

  return object;
}

export async function logRequestBody({ frontendRequest, frontendResponse }: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };

  if (isDebugEnabled()) {
    if (Config.get('DISABLE_LOG_ANONYMIZATION')) {
      Logger.debug('Original request body:', frontendRequest.traceId, frontendRequest.middleware.parsedBody);
    } else {
      const anonymized = anonymizeObject({ ...frontendRequest.middleware.parsedBody });
      Logger.debug('Anonymized request body:', frontendRequest.traceId, anonymized);
    }
  }

  return { frontendRequest, frontendResponse: null };
}

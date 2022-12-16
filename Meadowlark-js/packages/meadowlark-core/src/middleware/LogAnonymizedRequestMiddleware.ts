// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { isDebugEnabled, Logger } from '@edfi/meadowlark-utilities';
import { MiddlewareModel } from './MiddlewareModel';

export async function anonymizeAndLogRequestBody({
  frontendRequest,
  frontendResponse,
}: MiddlewareModel): Promise<MiddlewareModel> {
  // if there is a response already posted, we are done
  if (frontendResponse != null) return { frontendRequest, frontendResponse };

  if (isDebugEnabled() && !frontendRequest.middleware.resourceInfo.isDescriptor) {
    const copyOfParsedBody = { ...frontendRequest.middleware.parsedBody };
    Object.keys(copyOfParsedBody).forEach((key) => {
      copyOfParsedBody[key] = null;
    });

    Logger.debug('Anonymized request body:', frontendRequest.traceId, copyOfParsedBody);
  }

  return { frontendRequest, frontendResponse: null };
}

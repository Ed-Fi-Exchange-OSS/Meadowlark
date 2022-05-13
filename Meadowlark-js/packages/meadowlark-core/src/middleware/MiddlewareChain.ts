// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest } from '../handler/FrontendRequest';
import { FrontendResponse } from '../handler/FrontendResponse';

/**
 * Processing ends once there is a response.
 */
export type MiddlewareChain = {
  frontendRequest: FrontendRequest;
  frontendResponse: FrontendResponse | null;
};

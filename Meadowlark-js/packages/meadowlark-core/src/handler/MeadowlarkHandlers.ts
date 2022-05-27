// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { FrontendRequest } from './FrontendRequest';
import { FrontendResponse } from './FrontendResponse';

interface DocumentHandlers {
  upsert: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
  deleteIt: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
  get: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
  update: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
}

interface MetadataHandlers {
  apiVersion: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
  metaed: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
  openApiUrlList: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
  swaggerForDescriptorsAPI: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
  swaggerForResourcesAPI: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
}

interface OAuthHandlers {
  oauthHandler: (frontendRequest: FrontendRequest) => Promise<FrontendResponse>;
}

export interface MeadowlarkHandlers extends DocumentHandlers, MetadataHandlers, OAuthHandlers {}

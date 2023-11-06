// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EndpointName } from './EndpointName';
import { MetaEdResourceName } from './MetaEdResourceName';

/**
 * A collection of ResourceNames mapped to EndpointNames
 */
export type ResourceNameMapping = {
  [key: MetaEdResourceName]: EndpointName;
};

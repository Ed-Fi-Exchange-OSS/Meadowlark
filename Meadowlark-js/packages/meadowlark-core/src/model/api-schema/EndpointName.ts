// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Brand } from '../BrandType';

/**
 * A string type branded as an EndpointName, which is the name of an API resource endpoint. Typically, this is the same
 * as a decapitalized MetaEd entity name. However, there are exceptions, for example descriptors have a
 * "Descriptor" suffix on their endpoint name.
 */

export type EndpointName = Brand<string, 'EndpointName'>;

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Brand } from '../BrandType';

/**
 * A string type branded as a MetaEdResourceName, which is the name of an API resource. Typically, this is the same
 * as the corresponding MetaEd entity name. However, there are exceptions, for example descriptors have a
 * "Descriptor" suffix on their resource name.
 */

export type MetaEdResourceName = Brand<string, 'MetaEdResourceName'>;

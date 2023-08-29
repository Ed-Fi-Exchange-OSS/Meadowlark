// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { Brand } from '../BrandType';

/**
 * A string type branded as a ProjectNamespace, which is the URI path component referring to a ProjectSchema
 * e.g. "ed-fi" for an Ed-Fi data standard version.
 */

export type ProjectNamespace = Brand<string, 'ProjectNamespace'>;

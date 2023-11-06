// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { Brand } from './BrandType';

/**
 * A string type branded as a ProjectShortVersion, which is a shortened form of a project version
 * e.g. "v3.3b" for the Ed-Fi data standard version "3.3.1-b".
 */

export type ProjectShortVersion = Brand<string, 'ProjectShortVersion'>;

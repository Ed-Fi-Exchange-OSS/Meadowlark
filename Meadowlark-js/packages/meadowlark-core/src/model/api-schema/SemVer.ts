// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Brand } from '../BrandType';

/**
 * A string type branded as a SemVer, which is a semantic version string.
 * See https://semver.org/spec/v2.0.0.html
 */

export type SemVer = Brand<string, 'SemVer'>;

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix } from '@edfi/metaed-core';
import { ResourceInfo } from '@edfi/meadowlark-core';

export function entityTypeStringFromComponents(projectName: string, resourceVersion: string, resourceName: string): string {
  return `TYPE#${projectName}#${resourceVersion}#${resourceName}`;
}

export function entityTypeStringFrom(resourceInfo: ResourceInfo): string {
  const adjustedEntityName = resourceInfo.isDescriptor
    ? normalizeDescriptorSuffix(resourceInfo.resourceName)
    : resourceInfo.resourceName;
  return entityTypeStringFromComponents(resourceInfo.projectName, resourceInfo.resourceVersion, adjustedEntityName);
}

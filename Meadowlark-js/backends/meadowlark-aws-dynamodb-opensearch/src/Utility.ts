// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix } from '@edfi/metaed-core';
import { DocumentTypeInfo } from '@edfi/meadowlark-core';

export function entityTypeStringFromComponents(projectName: string, resourceVersion: string, resourceName: string): string {
  return `TYPE#${projectName}#${resourceVersion}#${resourceName}`;
}

export function entityTypeStringFrom(documentInfo: DocumentTypeInfo): string {
  const adjustedEntityName = documentInfo.isDescriptor
    ? normalizeDescriptorSuffix(documentInfo.resourceName)
    : documentInfo.resourceName;
  return entityTypeStringFromComponents(documentInfo.projectName, documentInfo.resourceVersion, adjustedEntityName);
}

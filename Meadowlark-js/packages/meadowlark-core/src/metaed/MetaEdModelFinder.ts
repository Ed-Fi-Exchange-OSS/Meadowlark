// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { TopLevelEntity } from '@edfi/metaed-core';
import { PathComponents } from '../model/PathComponents';
import { decapitalize } from '../Utility';
import { loadMetaEdState } from './LoadMetaEd';
import { modelPackageFor } from './MetaEdProjectMetadata';
import { getMetaEdModelForResourceName } from './ResourceNameMapping';

/**
 * Finds the MetaEd internal model that represents the given REST resource path.
 */
export async function findMetaEdModel(pathComponents: PathComponents): Promise<TopLevelEntity | undefined> {
  const lowerResourceName = decapitalize(pathComponents.endpointName);
  const modelNpmPackage = modelPackageFor(pathComponents.version);
  const { metaEd } = await loadMetaEdState(modelNpmPackage);

  return getMetaEdModelForResourceName(lowerResourceName, metaEd, pathComponents.namespace);
}

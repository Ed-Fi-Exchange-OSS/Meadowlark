// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EntityProperty } from '@edfi/metaed-core';
import { PropertyModifier } from './PropertyModifier';

/**
 * A property along with a possible modifier inherited from the parent of the property
 */
export type CollectedProperty = {
  property: EntityProperty;
  propertyModifier: PropertyModifier;
};

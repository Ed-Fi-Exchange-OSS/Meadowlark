// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Enhancer } from '@edfi/metaed-core';
import { enhance as entityPropertyMeadowlarkDataSetupEnhancer } from '../model/EntityPropertyMeadowlarkData';
import { enhance as entityMeadowlarkDataSetupEnhancer } from '../model/EntityMeadowlarkData';
import { enhance as subclassPropertyNamingCollisionEnhancer } from './SubclassPropertyNamingCollisionEnhancer';
import { enhance as referenceComponentEnhancer } from './ReferenceComponentEnhancer';
import { enhance as apiPropertyMappingEnhancer } from './ApiPropertyMappingEnhancer';
import { enhance as apiEntityMappingEnhancer } from './ApiEntityMappingEnhancer';
import { enhance as subclassApiEntityMappingEnhancer } from './SubclassApiEntityMappingEnhancer';
import { enhance as propertyCollectingEnhancer } from './PropertyCollectingEnhancer';
import { enhance as subclassPropertyCollectingEnhancer } from './SubclassPropertyCollectingEnhancer';
import { enhance as jsonSchemaEnhancer } from './JsonSchemaEnhancer';

export function enhancerList(): Enhancer[] {
  return [
    entityPropertyMeadowlarkDataSetupEnhancer,
    entityMeadowlarkDataSetupEnhancer,
    subclassPropertyNamingCollisionEnhancer,
    referenceComponentEnhancer,
    apiPropertyMappingEnhancer,
    propertyCollectingEnhancer,
    subclassPropertyCollectingEnhancer,
    apiEntityMappingEnhancer,
    subclassApiEntityMappingEnhancer,
    jsonSchemaEnhancer,
  ];
}

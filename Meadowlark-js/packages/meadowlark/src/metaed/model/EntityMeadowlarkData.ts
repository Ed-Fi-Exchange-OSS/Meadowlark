// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Joi from '@hapi/joi';
import { MetaEdEnvironment, EnhancerResult, getAllEntitiesOfType, ModelBase } from 'metaed-core';
import { ApiEntityMapping, NoApiEntityMapping } from './ApiEntityMapping';
import { CollectedProperty } from './CollectedProperty';

export type EntityMeadowlarkData = {
  /**
   * API shape metadata for this entity.
   */
  apiMapping: ApiEntityMapping;
  /**
   * The API JSON document Joi schema that corresponds to this MetaEd entity.
   */
  joiSchema: Joi.AnySchema;
  /**
   * Properties that belong under this entity in the API body
   */
  collectedProperties: CollectedProperty[];
};

/**
 * Initialize entity with Meadowlark data placeholder.
 */
export function addEntityMeadowlarkDataTo(entity: ModelBase) {
  if (entity.data.meadowlark == null) entity.data.meadowlark = {};

  Object.assign(entity.data.meadowlark, {
    apiMapping: NoApiEntityMapping,
    joiSchema: Joi.any(),
    collectedProperties: [],
  });
}

/**
 * Initialize all properties with Meadowlark data placeholder.
 */
export function enhance(metaEd: MetaEdEnvironment): EnhancerResult {
  getAllEntitiesOfType(metaEd, 'domainEntity', 'association', 'domainEntitySubclass', 'associationSubclass').forEach(
    (entity) => {
      if (entity.data.meadowlark == null) entity.data.meadowlark = {};
      addEntityMeadowlarkDataTo(entity);
    },
  );

  return {
    enhancerName: 'EntityMeadowlarkDataSetupEnhancer',
    success: true,
  };
}

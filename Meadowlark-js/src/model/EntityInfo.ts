// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix } from 'metaed-core';
import { AssignableInfo } from './AssignableInfo';
import { ReferentialConstraint } from './ReferentialConstraint';

export function buildNKString(naturalKey: string): string {
  if (naturalKey.startsWith('NK#')) return naturalKey;

  return `NK#${naturalKey}`;
}

export function entityTypeStringFromComponents(projectName: string, projectVersion: string, entityName: string): string {
  return `TYPE#${projectName}#${projectVersion}#${entityName}`;
}

export function entityTypeStringFrom(entityInfo: EntityTypeInfo): string {
  const adjustedEntityName = entityInfo.isDescriptor
    ? normalizeDescriptorSuffix(entityInfo.entityName)
    : entityInfo.entityName;
  return entityTypeStringFromComponents(entityInfo.projectName, entityInfo.projectVersion, adjustedEntityName);
}

/**
 * Type information for a MetaEd entity
 */
export interface EntityTypeInfo {
  /**
   * The MetaEd project name the entity belongs to.
   */
  projectName: string;

  /**
   * The MetaEd project version the entity belongs to.
   */
  projectVersion: string;
  /**
   * The name of the entity. Typically, this is the same as the entity metaEdName. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix to their name
   * to avoid name collisions with entities of the same metaEdName.
   */
  entityName: string;
  /**
   * Whether this entity is a descriptor. Descriptors are treated differently for other MetaEd model entities
   */
  isDescriptor: boolean;
}

/**
 * Information to uniquely identify a MetaEd entity by natural key
 */
export interface EntityIdentifyingInfo extends EntityTypeInfo {
  /**
   * The natural key of the entity extracted from the JSON body, in a bodyPathString=naturalKeyValue
   * form, hash-separated when their are multiple path/value pairs. The string is prefixed with "NK#".
   */
  naturalKey: string;
}

/**
 * Complete information on a validated MetaEd entity
 */
export interface EntityInfo extends EntityIdentifyingInfo {
  /**
   * A list of the foreign keys of the entity extracted from the JSON body
   */
  foreignKeys: ReferentialConstraint[];

  /**
   * A list of the non-reference (meaning top-level only) descriptor values of the entity extracted from the JSON body
   */
  descriptorValues: ReferentialConstraint[];

  /**
   * If this entity is assignable to another entity (meaning it is part of a subclass/superclass relationship)
   * this is the assignable natural key and superclass information.
   */
  assignableInfo: AssignableInfo | null;

  /**
   * The student id extracted from the JSON body, if any (for security)
   */
  studentId: string | null;

  /**
   * The education organization id extracted from the JSON body, if any (for security)
   */
  edOrgId: string | null;
}

/**
 * Creates a new empty EntityInfo object
 */
export function newEntityInfo(): EntityInfo {
  return {
    entityName: '',
    isDescriptor: false,
    projectName: '',
    projectVersion: '',
    naturalKey: '',
    assignableInfo: null,
    foreignKeys: [],
    descriptorValues: [],
    studentId: null,
    edOrgId: null,
  };
}

/**
 * The null object for EntityInfo
 */
export const NoEntityInfo = {
  ...newEntityInfo(),
  entityName: 'NoEntityName',
  projectName: 'NoProjectName',
  projectVersion: '0.0.0',
};

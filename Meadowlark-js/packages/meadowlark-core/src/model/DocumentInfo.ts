// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { normalizeDescriptorSuffix } from '@edfi/metaed-core';
import { Assignable } from './Assignable';
import { DocumentIdentity, NoDocumentIdentity } from './DocumentIdentity';
import { DocumentReference } from './DocumentReference';

/**
 * Type information for a MetaEd entity
 */
export interface DocumentTypeInfo {
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
export interface DocumentIdentifyingInfo extends DocumentTypeInfo {
  /**
   * The natural key of the entity extracted from the JSON body, in a documentPathString=naturalKeyValue
   * form, hash-separated when their are multiple path/value pairs. The string is prefixed with "NK#".
   */
  documentIdentity: DocumentIdentity;
}

/**
 * Complete information on a validated MetaEd entity
 */
export interface DocumentInfo extends DocumentIdentifyingInfo {
  /**
   * A list of the foreign keys of the entity extracted from the JSON body
   */
  foreignKeys: DocumentReference[];

  /**
   * A list of the non-reference (meaning top-level only) descriptor values of the entity extracted from the JSON body
   */
  descriptorValues: DocumentReference[];

  /**
   * If this entity is assignable to another entity (meaning it is part of a subclass/superclass relationship)
   * this is the assignable natural key and superclass information.
   */
  assignableInfo: Assignable | null;

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
 * Creates a new empty DocumentInfo object
 */
export function newEntityInfo(): DocumentInfo {
  return {
    entityName: '',
    isDescriptor: false,
    projectName: '',
    projectVersion: '',
    documentIdentity: NoDocumentIdentity,
    assignableInfo: null,
    foreignKeys: [],
    descriptorValues: [],
    studentId: null,
    edOrgId: null,
  };
}

/**
 * The null object for DocumentInfo
 */
export const NoEntityInfo = {
  ...newEntityInfo(),
  entityName: 'NoEntityName',
  projectName: 'NoProjectName',
  projectVersion: '0.0.0',
};

export function entityTypeStringFromComponents(projectName: string, projectVersion: string, entityName: string): string {
  return `TYPE#${projectName}#${projectVersion}#${entityName}`;
}

export function entityTypeStringFrom(documentInfo: DocumentTypeInfo): string {
  const adjustedEntityName = documentInfo.isDescriptor
    ? normalizeDescriptorSuffix(documentInfo.entityName)
    : documentInfo.entityName;
  return entityTypeStringFromComponents(documentInfo.projectName, documentInfo.projectVersion, adjustedEntityName);
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentObjectKey } from './DocumentObjectKey';
import { JsonPath } from './JsonPath';

type BaseDocumentPaths = {
  /**
   * A mapping of unique DocumentObjectKeys to JsonPaths. This is used as a building block for document identities
   * and document references, where the JsonPaths can later be turned into the values in a document, and the keys
   * indicate what the value represents.
   *
   * As an example, these are the JsonPaths for CourseOffering on Section, a reference with four fields:
   *
   * {
   *   localCourseCode: '$.courseOfferingReference.localCourseCode',
   *   schoolId: '$.courseOfferingReference.schoolId',
   *   schoolYear: '$.courseOfferingReference.schoolYear',
   *   sessionName: '$.courseOfferingReference.sessionName',
   * }
   */
  paths: { [key: DocumentObjectKey]: JsonPath };

  /**
   * An ordering of the paths by DocumentObjectKey, used to ensure consistent ordering downstream.
   */
  pathOrder: DocumentObjectKey[];
};

/**
 * JsonPath information for a reference MetaEd property
 */
export type ReferencePaths = BaseDocumentPaths & {
  /**
   * Discriminator between reference and scalar path types
   */
  isReference: true;

  /**
   * The MetaEd project name the referenced API resource is defined in e.g. "EdFi" for a data standard entity.
   */
  projectName: string;

  /**
   * The name of the referenced API resource. Typically, this is the same as the corresponding MetaEd entity name. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
   */
  resourceName: string;

  /**
   * Whether this reference is a descriptor. Descriptors are treated differently from other documents
   */
  isDescriptor: boolean;
};

/**
 * A JsonPath for a scalar MetaEd property
 */
export type ScalarPath = BaseDocumentPaths & {
  /**
   * Discriminator between reference and scalar path types
   */
  isReference: false;
};

/**
 * DocumentPaths provides JsonPaths to values corresponding to reference and scalar MetaEd properties in a resource document.
 */
export type DocumentPaths = ReferencePaths | ScalarPath;

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  DocumentIdentity,
  documentIdForDocumentReference,
  documentIdForSuperclassInfo,
  DocumentInfo,
  DocumentReference,
  ResourceInfo,
} from '@edfi/meadowlark-core';

export interface MeadowlarkDocumentId {
  /**
   * A string hash derived from the project name, resource name, resource version
   * and identity of the API document. This field replaces the built-in MongoDB _id.
   */
  _id: string;
}

export interface MeadowlarkDocument extends MeadowlarkDocumentId {
  /**
   * The identity elements extracted from the API document.
   */
  documentIdentity: DocumentIdentity;

  /**
   * The MetaEd project name the API document resource is defined in e.g. "EdFi" for a data standard entity.
   */
  projectName: string;

  /**
   * The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
   */
  resourceName: string;

  /**
   * The resource version as a string. This is the same as the MetaEd project version
   * the entity is defined in e.g. "3.3.1-b" for a 3.3b data standard entity.
   */
  resourceVersion: string;

  /**
   * The Ed-Fi ODS/API document itself.
   */
  edfiDoc: any;

  /**
   * An array of ids extracted from the ODS/API document for all externally
   * referenced documents.
   */
  outRefs: string[];

  /**
   * An array of ids this document will satisfy when reference validation performs existence checks.
   * This array always includes the document id. If this document is a subclass, the array will also
   * contain the id of this document in superclass form (superclass name and project, identity property
   * naming differences - like schoolId versus educationOrganizationId - accounted for).
   *
   * The idea is that a subclass document provides the existence validation of both the document as its given type
   * AND as a reference to the superclass when the identity is equivalent.
   *
   * Example: Assessment has a reference to EducationOrganization, and ClassPeriod has a reference to School.
   *          School is a subclass of EducationOrganization, with schoolId being the identity of School and
   *          educationOrganizationId being the corresponding identity of EducationOrganization.
   *
   *          As a result, a single School document with schoolId=123 will satisfy the validation of both
   *          a reference from ClassPeriod to a School with schoolId=123, as well as a reference from
   *          Assessment to EducationOrganization with educationOrganizationId=123.
   */
  existenceIds: string[];

  /**
   * True if this document has been reference and descriptor validated.
   */
  validated: boolean;

  /**
   * True if this document is a descriptor.
   */
  isDescriptor: boolean;

  /**
   * Creator of this document
   */
  createdBy: string;

  /**
   * An ObjectId managed by Meadowlark transactions for read locking. Optional because it does not need to be
   * set in code. See https://www.mongodb.com/blog/post/how-to-select--for-update-inside-mongodb-transactions
   */
  lock?: any;
}

export function meadowlarkDocumentFrom(
  resourceInfo: ResourceInfo,
  documentInfo: DocumentInfo,
  id: string,
  edfiDoc: object,
  validate: boolean,
  createdBy: string,
): MeadowlarkDocument {
  const existenceIds: string[] = [id];
  if (documentInfo.superclassInfo != null) {
    existenceIds.push(documentIdForSuperclassInfo(documentInfo.superclassInfo));
  }

  return {
    documentIdentity: documentInfo.documentIdentity,
    projectName: resourceInfo.projectName,
    resourceName: resourceInfo.resourceName,
    resourceVersion: resourceInfo.resourceVersion,
    isDescriptor: resourceInfo.isDescriptor,
    _id: id,
    edfiDoc,
    existenceIds,
    outRefs: documentInfo.documentReferences.map((dr: DocumentReference) => documentIdForDocumentReference(dr)),
    validated: validate,
    createdBy,
  };
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MeadowlarkId } from './IdTypes';
import { meadowlarkIdForDocumentIdentity } from './DocumentIdentity';
import type { DocumentIdentity } from './DocumentIdentity';

export type DocumentReference = {
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
   * Whether this document is a descriptor. Descriptors are treated differently from other documents
   */
  isDescriptor: boolean;

  /**
   * The document identity representing this reference.
   */
  documentIdentity: DocumentIdentity;
};

/**
 * Returns the id of the given DocumentReference, using the project name, resource name, resource version
 * and identity of the API document.
 */
export function getMeadowlarkIdForDocumentReference(documentReference: DocumentReference): MeadowlarkId {
  return meadowlarkIdForDocumentIdentity(
    {
      projectName: documentReference.projectName,
      resourceName: documentReference.resourceName,
      isDescriptor: documentReference.isDescriptor,
    },
    documentReference.documentIdentity,
  );
}

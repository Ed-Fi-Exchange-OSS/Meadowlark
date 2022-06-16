// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DescriptorDocument } from './DescriptorDocument';
import { DocumentIdentity } from './DocumentIdentity';
import { DocumentInfo, newDocumentInfo } from './DocumentInfo';

/**
 * Creates a new DocumentIdentity from the given DescriptorDocument
 */
export function descriptorDocumentIdentityFrom(descriptorDocument: DescriptorDocument): DocumentIdentity {
  return [
    {
      name: 'descriptor',
      value: `${descriptorDocument.namespace}#${descriptorDocument.codeValue}`,
    },
  ];
}

/**
 * Creates a new DescriptorDocumentInfo from the given DescriptorDocument
 */
export function descriptorDocumentInfoFrom(descriptorDocument: DescriptorDocument): DocumentInfo {
  return {
    ...newDocumentInfo(),
    documentIdentity: descriptorDocumentIdentityFrom(descriptorDocument),
  };
}

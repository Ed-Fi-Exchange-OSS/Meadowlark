// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentIdentity, MeadowlarkId, DocumentUuid } from '@edfi/meadowlark-core';

export interface MeadowlarkDocumentId {
  /**
   * A string hash derived from the project name, resource name
   * and identity of the API document. This field replaces the built-in MongoDB _id.
   */
  meadowlark_id: MeadowlarkId;
  /**
   * The UUID for the document.
   */
  document_uuid: DocumentUuid;
}

export interface MeadowlarkDocument extends MeadowlarkDocumentId {
  /**
   * The identity elements extracted from the API document.
   */
  document_identity: DocumentIdentity;

  /**
   * The MetaEd project name the API document resource is defined in e.g. "EdFi" for a data standard entity.
   */
  project_name: string;

  /**
   * The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
   */
  resource_name: string;

  /**
   * The resource version as a string. This is the same as the MetaEd project version
   * the entity is defined in e.g. "3.3.1-b" for a 3.3b data standard entity.
   */
  resource_version: string;

  /**
   * The Ed-Fi ODS/API document itself.
   */
  edfi_doc: any;

  /**
   * True if this document has been reference and descriptor validated.
   */
  validated: boolean;

  /**
   * True if this document is a descriptor.
   */
  is_descriptor: boolean;

  /**
   * Creator of this document
   */
  created_by: string;
}

export function getEmptyMeadowlarkDocument(): MeadowlarkDocument {
  return {} as MeadowlarkDocument;
}

export function isMeadowlarkDocumentEmpty(meadowlarkDocument: MeadowlarkDocument): boolean {
  return Object.keys(meadowlarkDocument).length === 0;
}

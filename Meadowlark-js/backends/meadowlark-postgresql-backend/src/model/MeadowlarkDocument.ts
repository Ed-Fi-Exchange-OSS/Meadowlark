// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentIdentity, MeadowlarkId, NoDocumentIdentity, DocumentUuid } from '@edfi/meadowlark-core';

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

export interface MeadowlarkDocumentIdAndAliasId extends MeadowlarkDocumentId {
  /**
   * Alias meadowlarkIds include the document meadowlarkId itself along with any superclass variations that the document
   * satisfies. For example, a School is a subclass of EducationOrganization, so each School document has an additional
   * alias meadowlarkId as an EducationOrganization.
   */
  alias_meadowlark_id: MeadowlarkId;
}

/**
 * A MeadowlarkDocument is roughly equivalent to MeadowlarkDocuments in NoSQL datastores. It contains
 * the Ed-Fi API document itself, plus metadata about the document including the documentUuid and
 * meadowlarkId, and resource/version information.
 */
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

  /*
   * Creation date as as Unix timestamp, or null if this is a document to be updated and we don't know the create time yet
   */
  created_at: number | null;

  /*
   * Last modified date as as Unix timestamp.
   */
  last_modified_at: number;
}

/**
 * Creates a new empty newMeadowlarkDocument object
 */
export function newMeadowlarkDocument(): MeadowlarkDocument {
  return {
    meadowlark_id: undefined as unknown as MeadowlarkId,
    document_uuid: undefined as unknown as DocumentUuid,
    document_identity: NoDocumentIdentity,
    project_name: '',
    resource_name: '',
    resource_version: '',
    edfi_doc: null,
    validated: false,
    is_descriptor: false,
    created_by: '',
    created_at: null,
    last_modified_at: 0,
  };
}

/**
 * The null object for DocumentInfo
 */
export const NoMeadowlarkDocument = Object.freeze({
  ...newMeadowlarkDocument(),
});

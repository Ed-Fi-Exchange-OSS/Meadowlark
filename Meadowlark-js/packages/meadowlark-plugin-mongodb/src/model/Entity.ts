// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export interface Entity {
  /**
   * A string hash of the project name, entity type, entity version and body of
   * the API document. This is identical to PK identifier in the DynamoDB
   * implementation. This field will be a unique index on the collection.
   */
  id: string;

  /**
   * The MetaEd project name the entity is defined in e.g. "EdFi" for a data standard entity.
   */
  project_name: String;

  /**
   * The entity type as a string e.g. "Student".
   */
  entity_type: String;

  /**
   * The entity version as a string. This is the same as MetaEd project version
   * the entity is defined in e.g. "3.3.1-b" for a 3.3b data standard entity.
   */
  entity_version: String;

  /**
   * The ODS/API document body as a sub-document.
   */
  edfi_doc: any;

  /**
   * An array of _ids extracted from the ODS/API document body for all externally
   * referenced documents.
   */
  out_refs: string[];
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export interface Document {
  /**
   * A string hash derived from the project name, resource name, resource version
   * and identity of the API document. This field will be a unique index on the collection.
   */
  id: string;

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
}

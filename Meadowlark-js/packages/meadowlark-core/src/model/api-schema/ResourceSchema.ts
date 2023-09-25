// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EqualityConstraint } from './EqualityConstraint';
import { DocumentPaths } from './DocumentPaths';
import { NoSchemaRoot, SchemaRoot } from './JsonSchema';
import { MetaEdPropertyFullName } from './MetaEdPropertyFullName';
import { MetaEdResourceName } from './MetaEdResourceName';
import { MetaEdProjectName } from './MetaEdProjectName';

/**
 * API resource schema information common between regular and subclass resources
 */
export type BaseResourceSchema = {
  /**
   * The resource name. Typically, this is the entity metaEdName.
   */
  resourceName: MetaEdResourceName;

  /**
   * Whether this resource is a descriptor. Descriptors are treated differently from other resources
   */
  isDescriptor: boolean;

  /**
   * Whether this resource is a schoolYearEnumeration. They are treated differently from other resources
   */
  isSchoolYearEnumeration: boolean;

  /**
   * Whether API clients are permitted to modify the identity of an existing resource document.
   */
  allowIdentityUpdates: boolean;

  /**
   * The API document JSON schema that corresponds to this resource on insert.
   */
  jsonSchemaForInsert: SchemaRoot;

  /**
   * The API document JSON schema that corresponds to this resource on update.
   */
  jsonSchemaForUpdate: SchemaRoot;

  /**
   * The API document JSON schema that corresponds to this resource on query.
   */
  jsonSchemaForQuery: SchemaRoot;

  /**
   * A list of EqualityConstraints to be applied to a resource document. An EqualityConstraint
   * is a source/target JsonPath pair.
   */
  equalityConstraints: EqualityConstraint[];

  /**
   * A list of the MetaEd property fullnames for each property that is part of the identity
   * for this resource, in lexical order
   */
  identityFullnames: MetaEdPropertyFullName[];

  /**
   * A collection of MetaEd property fullnames mapped to DocumentPaths objects,
   * which provide JsonPaths to the corresponding values in a resource document.
   */
  documentPathsMapping: { [key: MetaEdPropertyFullName]: DocumentPaths };
};

/**
 * The additional ResourceSchema fields for an Association subclass
 */
export type AssociationSubclassResourceSchema = BaseResourceSchema & {
  /**
   * The project name and resource name for the superclass
   */
  superclassProjectName: MetaEdProjectName;
  superclassResourceName: MetaEdResourceName;
};

/**
 * The additional ResourceSchema fields for a DomainEntity subclass
 */
export type DomainEntitySubclassResourceSchema = AssociationSubclassResourceSchema & {
  /**
   * The superclass identity field and the matching subclass identity field name.
   * This is found in MetaEd as an "identity rename". MetaEd only allows the super/subclass
   * relationship of Domain Entities to have a single common identity field.
   */
  superclassIdentityFullname: MetaEdPropertyFullName;
  subclassIdentityFullname: MetaEdPropertyFullName;
};

/**
 * API resource schema information as a whole, with "isSubclass" as a differentiator between
 * regular and subclass resources.
 */
export type ResourceSchema =
  | (BaseResourceSchema & {
      isSubclass: false;
    })
  | (AssociationSubclassResourceSchema & {
      isSubclass: true;
      subclassType: 'association';
    })
  | (DomainEntitySubclassResourceSchema & {
      isSubclass: true;
      subclassType: 'domainEntity';
    });

/**
 * The ResourceSchema null object
 */
export const NoResourceSchema: ResourceSchema = Object.freeze({
  resourceName: 'NoResourceSchema' as MetaEdResourceName,
  isDescriptor: false,
  isSchoolYearEnumeration: false,
  allowIdentityUpdates: false,
  jsonSchemaForInsert: NoSchemaRoot,
  jsonSchemaForUpdate: NoSchemaRoot,
  jsonSchemaForQuery: NoSchemaRoot,
  equalityConstraints: [],
  identityFullnames: [],
  documentPathsMapping: {},
  isSubclass: false,
});

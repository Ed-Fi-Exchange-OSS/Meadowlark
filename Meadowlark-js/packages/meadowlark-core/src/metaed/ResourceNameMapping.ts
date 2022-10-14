// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-restricted-syntax */
import {
  Association,
  AssociationSubclass,
  Descriptor,
  DomainEntity,
  DomainEntitySubclass,
  MetaEdEnvironment,
  normalizeDescriptorSuffix,
  TopLevelEntity,
} from '@edfi/metaed-core';
import { pluralize } from '@edfi/metaed-plugin-edfi-meadowlark';
import { decapitalize } from '../Utility';

/**
 * A mapping of resource names to MetaEd models
 */
type ResourceNameToMetaEdModelMap = Map<string, TopLevelEntity>;

/**
 * A MetaEd project (AKA namespace) name
 */
type ProjectName = string;

// simple cache implementation, see: https://rewind.io/blog/simple-caching-in-aws-lambda-functions/
/** This is a cache of project names to a mapping of resource names to MetaEd model objects */
let resourceMappingCache: Map<ProjectName, ResourceNameToMetaEdModelMap> = new Map();

/**
 * For tests only - resets the resource mapping cache
 */
export function resetCache(): void {
  resourceMappingCache = new Map();
}

/**
 * Converts a MetaEd model name to its resource name
 */
function resourceNameFrom(metaEdName: string): string {
  return pluralize(decapitalize(metaEdName));
}

/**
 * Creates a mapping between resource names and the MetaEd model object that the resource
 * refers to, for all model objects in the given MetaEd project. Caches the results for future calls.
 *
 * In the MetaEd internal model, each model object type in a project (namespace) is stored in a separate collection.
 * For example, all core Domain Entities are in the collection "metaEd.namespace('EdFi').entity.domainEntity".
 * We iterate through each model type that is expressed as an API resource.
 */
function getResourceNameMappingForNamespace(metaEd: MetaEdEnvironment, projectName: string): ResourceNameToMetaEdModelMap {
  let resourceNameMapping: ResourceNameToMetaEdModelMap | undefined = resourceMappingCache.get(projectName);
  if (resourceNameMapping != null) return resourceNameMapping;

  resourceNameMapping = new Map();

  const domainEntities: IterableIterator<DomainEntity> | undefined = metaEd.namespace
    .get(projectName)
    ?.entity.domainEntity.values();
  if (domainEntities != null) {
    for (const domainEntity of domainEntities) {
      // Abstract entities are not resources (e.g. EducationOrganization)
      if (!domainEntity.isAbstract) {
        resourceNameMapping.set(resourceNameFrom(domainEntity.metaEdName), domainEntity);
      }
    }
  }

  const associations: IterableIterator<Association> | undefined = metaEd.namespace
    .get(projectName)
    ?.entity.association.values();
  if (associations != null) {
    for (const association of associations) {
      // This is a workaround for the fact that the ODS/API required GeneralStudentProgramAssociation to
      // be abstract although there is no MetaEd language annotation to make an Association abstract.
      if (association.metaEdName !== 'GeneralStudentProgramAssociation')
        resourceNameMapping.set(resourceNameFrom(association.metaEdName), association);
    }
  }

  const domainEntitySubclasses: IterableIterator<DomainEntitySubclass> | undefined = metaEd.namespace
    .get(projectName)
    ?.entity.domainEntitySubclass.values();
  if (domainEntitySubclasses != null) {
    for (const domainEntitySubclass of domainEntitySubclasses) {
      resourceNameMapping.set(resourceNameFrom(domainEntitySubclass.metaEdName), domainEntitySubclass);
    }
  }

  const associationSubclasses: IterableIterator<AssociationSubclass> | undefined = metaEd.namespace
    .get(projectName)
    ?.entity.associationSubclass.values();
  if (associationSubclasses != null) {
    for (const associationSubclass of associationSubclasses) {
      resourceNameMapping.set(resourceNameFrom(associationSubclass.metaEdName), associationSubclass);
    }
  }

  const descriptors: IterableIterator<Descriptor> | undefined = metaEd.namespace
    .get(projectName)
    ?.entity.descriptor.values();
  if (descriptors != null) {
    for (const descriptor of descriptors) {
      resourceNameMapping.set(pluralize(normalizeDescriptorSuffix(decapitalize(descriptor.metaEdName))), descriptor);
    }
  }

  resourceMappingCache.set(projectName, resourceNameMapping);
  return resourceNameMapping;
}

/**
 * Looks up the MetaEd model that a given resource name refers to, for a given MetaEd project.
 * Returns top-level MetaEd entity matching the given resourceName, if it exists
 */
export function getMetaEdModelForResourceName(
  resourceName: string,
  metaEd: MetaEdEnvironment,
  projectName: string,
): TopLevelEntity | undefined {
  const localNamespace = projectName === 'ed-fi' ? 'EdFi' : projectName;
  return getResourceNameMappingForNamespace(metaEd, localNamespace).get(resourceName);
}

/**
 * Returns all resource names for a given project name
 */
export function getResourceNamesForProject(metaEd: MetaEdEnvironment, projectName: string): string[] {
  const adjustedProjectName = projectName === 'ed-fi' ? 'EdFi' : projectName;
  return [...getResourceNameMappingForNamespace(metaEd, adjustedProjectName).keys()];
}

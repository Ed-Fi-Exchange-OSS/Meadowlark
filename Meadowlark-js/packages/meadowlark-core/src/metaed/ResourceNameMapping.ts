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

// simple cache implementation, see: https://rewind.io/blog/simple-caching-in-aws-lambda-functions/
/** This is a mapping of resource names to MetaEd model objects, partitioned by namespace */
const resourceMappingCache: Map<string, Map<string, TopLevelEntity>> = new Map();

function resourceNameFrom(metaEdName: string): string {
  return pluralize(decapitalize(metaEdName));
}

function getResourceCache(metaEd: MetaEdEnvironment, namespace: string): Map<string, TopLevelEntity> {
  let mappingForNamespace: Map<string, TopLevelEntity> | undefined = resourceMappingCache.get(namespace);
  if (mappingForNamespace != null) return mappingForNamespace;

  mappingForNamespace = new Map();

  const domainEntities: IterableIterator<DomainEntity> | undefined = metaEd.namespace
    .get(namespace)
    ?.entity.domainEntity.values();
  if (domainEntities != null) {
    for (const domainEntity of domainEntities) {
      if (!domainEntity.isAbstract) {
        mappingForNamespace.set(resourceNameFrom(domainEntity.metaEdName), domainEntity);
      }
    }
  }

  const associations: IterableIterator<Association> | undefined = metaEd.namespace
    .get(namespace)
    ?.entity.association.values();
  if (associations != null) {
    for (const association of associations) {
      // This is a workaround for the fact that the ODS/API required GeneralStudentProgramAssociation to
      // be abstract although there is no MetaEd language annotation to make an Association abstract.
      if (association.metaEdName !== 'GeneralStudentProgramAssociation')
        mappingForNamespace.set(resourceNameFrom(association.metaEdName), association);
    }
  }

  const domainEntitySubclasses: IterableIterator<DomainEntitySubclass> | undefined = metaEd.namespace
    .get(namespace)
    ?.entity.domainEntitySubclass.values();
  if (domainEntitySubclasses != null) {
    for (const domainEntitySubclass of domainEntitySubclasses) {
      mappingForNamespace.set(resourceNameFrom(domainEntitySubclass.metaEdName), domainEntitySubclass);
    }
  }

  const associationSubclasses: IterableIterator<AssociationSubclass> | undefined = metaEd.namespace
    .get(namespace)
    ?.entity.associationSubclass.values();
  if (associationSubclasses != null) {
    for (const associationSubclass of associationSubclasses) {
      mappingForNamespace.set(resourceNameFrom(associationSubclass.metaEdName), associationSubclass);
    }
  }

  const descriptors: IterableIterator<Descriptor> | undefined = metaEd.namespace.get(namespace)?.entity.descriptor.values();
  if (descriptors != null) {
    for (const descriptor of descriptors) {
      mappingForNamespace.set(pluralize(normalizeDescriptorSuffix(decapitalize(descriptor.metaEdName))), descriptor);
    }
  }

  resourceMappingCache.set(namespace, mappingForNamespace);
  return mappingForNamespace;
}

/**
 * Returns top-level MetaEd entity matching the given resourceName, if it exists
 */
export function getMatchingMetaEdModelFrom(
  resourceName: string,
  metaEd: MetaEdEnvironment,
  namespace: string,
): TopLevelEntity | undefined {
  const localNamespace = namespace === 'ed-fi' ? 'EdFi' : namespace;
  return getResourceCache(metaEd, localNamespace).get(resourceName);
}

export function getResourceNames(metaEd: MetaEdEnvironment, namespace: string): string[] {
  const localNamespace = namespace === 'ed-fi' ? 'EdFi' : namespace;
  return [...getResourceCache(metaEd, localNamespace).keys()];
}

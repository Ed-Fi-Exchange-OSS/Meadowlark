// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable dot-notation */

import {
  newMetaEdEnvironment,
  MetaEdEnvironment,
  DomainEntityBuilder,
  MetaEdTextBuilder,
  NamespaceBuilder,
} from '@edfi/metaed-core';
import { domainEntityReferenceEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import {
  entityPropertyApiSchemaDataSetupEnhancer,
  apiEntityMappingEnhancer,
  entityApiSchemaDataSetupEnhancer,
  referenceComponentEnhancer,
  apiPropertyMappingEnhancer,
  propertyCollectingEnhancer,
} from '@edfi/metaed-plugin-edfi-api-schema';
import { extractDocumentReferences } from '../../src/extraction/DocumentReferenceExtractor';
import { extractDocumentIdentity } from '../../src/extraction/DocumentIdentityExtractor';
import { DocumentReference } from '../../src/model/DocumentReference';
import { DocumentIdentity } from '../../src/model/DocumentIdentity';
import { ApiSchema } from '../../src/model/api-schema/ApiSchema';
import { ResourceSchema } from '../../src/model/api-schema/ResourceSchema';
import { apiSchemaFrom } from '../TestHelper';

describe('when comparing identities with references from domain entity referencing one as identity and another as collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let referenceExtractionResult: DocumentReference[] = [];
  let classPeriodIdentityExtractionResult: DocumentIdentity = [];
  let courseOfferingIdentityExtractionResult: DocumentIdentity = [];

  const bodyWithReferences = {
    sectionIdentifier: 'Bob',
    courseOfferingReference: {
      localCourseCode: 'abc',
      schoolId: '23',
    },
    classPeriods: [
      {
        classPeriodReference: {
          schoolId: '24',
          classPeriodName: 'z1',
        },
      },
      {
        classPeriodReference: {
          schoolId: '25',
          classPeriodName: 'z2',
        },
      },
    ],
  };

  const classPeriodIdentityBody = {
    classPeriodName: 'z1',
    schoolReference: {
      schoolId: '24',
    },
  };

  const courseOfferingIdentityBody = {
    localCourseCode: 'abc',
    schoolReference: {
      schoolId: '23',
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityIdentity('CourseOffering', 'doc')
      .withDomainEntityProperty('ClassPeriod', 'doc', true, true)
      .withEndDomainEntity()

      .withStartDomainEntity('CourseOffering')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
      .withDomainEntityIdentity('School', 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity('ClassPeriod')
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
      .withDomainEntityIdentity('School', 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity('School')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntity()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyApiSchemaDataSetupEnhancer(metaEd);
    entityApiSchemaDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const sectionResourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    const classPeriodResourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['classPeriods'];
    const courseOfferingResourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['courseOfferings'];

    referenceExtractionResult = extractDocumentReferences(apiSchema, sectionResourceSchema, bodyWithReferences);
    classPeriodIdentityExtractionResult = extractDocumentIdentity(classPeriodResourceSchema, classPeriodIdentityBody);
    courseOfferingIdentityExtractionResult = extractDocumentIdentity(
      courseOfferingResourceSchema,
      courseOfferingIdentityBody,
    );
  });

  it('should have classPeriod reference and identity match', () => {
    const [, classPeriodReferenceExtractionResult] = referenceExtractionResult;
    expect(classPeriodReferenceExtractionResult.documentIdentity).toEqual(classPeriodIdentityExtractionResult);
  });

  it('should have courseOffering reference and identity match', () => {
    const [courseOfferingReferenceExtractionResult] = referenceExtractionResult;
    expect(courseOfferingReferenceExtractionResult.documentIdentity).toEqual(courseOfferingIdentityExtractionResult);
  });
});

describe('when comparing identities with references with three levels of identities on a collection reference', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let referenceExtractionResult: DocumentReference[] = [];
  let classPeriodIdentityExtractionResult: DocumentIdentity = [];

  const bodyWithReferences = {
    sectionIdentifier: 'Bob',
    classPeriods: [
      {
        classPeriodReference: {
          schoolId: '24',
          classPeriodName: 'c1',
          sessionName: 's1',
          secondLevelName: 'e1',
          thirdLevelName: 't1',
        },
      },
      {
        classPeriodReference: {
          schoolId: '25',
          classPeriodName: 'c2',
          sessionName: 's2',
          secondLevelName: 'e2',
          thirdLevelName: 't2',
        },
      },
    ],
  };

  const classPeriodIdentityBody = {
    classPeriodName: 'c1',
    schoolReference: {
      schoolId: '24',
    },
    sessionReference: {
      sessionName: 's1',
      schoolId: '24',
      secondLevelName: 'e1',
      thirdLevelName: 't1',
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityProperty('ClassPeriod', 'doc', true, true)
      .withEndDomainEntity()

      .withStartDomainEntity('ClassPeriod')
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
      .withDomainEntityIdentity('School', 'doc')
      .withDomainEntityIdentity('Session', 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity('Session')
      .withDocumentation('doc')
      .withStringIdentity('SessionName', 'doc', '30')
      .withDomainEntityIdentity('SecondLevel', 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity('School')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntity()

      .withStartDomainEntity('SecondLevel')
      .withDocumentation('doc')
      .withStringIdentity('SecondLevelName', 'doc', '30')
      .withDomainEntityIdentity('ThirdLevel', 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity('ThirdLevel')
      .withDocumentation('doc')
      .withStringIdentity('ThirdLevelName', 'doc', '30')
      .withEndDomainEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyApiSchemaDataSetupEnhancer(metaEd);
    entityApiSchemaDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const sectionResourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    const classPeriodResourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['classPeriods'];

    referenceExtractionResult = extractDocumentReferences(apiSchema, sectionResourceSchema, bodyWithReferences);
    classPeriodIdentityExtractionResult = extractDocumentIdentity(classPeriodResourceSchema, classPeriodIdentityBody);
  });

  it('should have classPeriod reference and identity match', () => {
    const [classPeriodReferenceExtractionResult] = referenceExtractionResult;
    expect(classPeriodReferenceExtractionResult.documentIdentity).toEqual(classPeriodIdentityExtractionResult);
  });
});

describe('when comparing identities with references with two levels of identities with a merge on School', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let referenceExtractionResult: DocumentReference[] = [];
  let classPeriodIdentityExtractionResult: DocumentIdentity = [];

  const bodyWithReferences = {
    sectionIdentifier: 'Bob',
    classPeriods: [
      {
        classPeriodReference: {
          schoolId: '24',
          classPeriodName: 'c1',
          sessionName: 's1',
        },
      },
      {
        classPeriodReference: {
          schoolId: '25',
          classPeriodName: 'c2',
          sessionName: 's2',
        },
      },
    ],
  };

  const classPeriodIdentityBody = {
    classPeriodName: 'c1',
    schoolReference: {
      schoolId: '24',
    },
    sessionReference: {
      sessionName: 's1',
      schoolId: '24',
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityProperty('ClassPeriod', 'doc', true, true)
      .withEndDomainEntity()

      .withStartDomainEntity('ClassPeriod')
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
      .withDomainEntityIdentity('School', 'doc')
      .withDomainEntityIdentity('Session', 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity('Session')
      .withDocumentation('doc')
      .withStringIdentity('SessionName', 'doc', '30')
      .withDomainEntityIdentity('School', 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity('School')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyApiSchemaDataSetupEnhancer(metaEd);
    entityApiSchemaDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const sectionResourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    const classPeriodResourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['classPeriods'];

    referenceExtractionResult = extractDocumentReferences(apiSchema, sectionResourceSchema, bodyWithReferences);
    classPeriodIdentityExtractionResult = extractDocumentIdentity(classPeriodResourceSchema, classPeriodIdentityBody);
  });

  it('should have classPeriod reference and identity match', () => {
    const [classPeriodReferenceExtractionResult] = referenceExtractionResult;
    expect(classPeriodReferenceExtractionResult.documentIdentity).toEqual(classPeriodIdentityExtractionResult);
  });
});

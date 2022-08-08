// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  newMetaEdEnvironment,
  MetaEdEnvironment,
  DomainEntityBuilder,
  MetaEdTextBuilder,
  NamespaceBuilder,
} from '@edfi/metaed-core';
import { domainEntityReferenceEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import {
  entityPropertyMeadowlarkDataSetupEnhancer,
  apiEntityMappingEnhancer,
  entityMeadowlarkDataSetupEnhancer,
  referenceComponentEnhancer,
  apiPropertyMappingEnhancer,
  propertyCollectingEnhancer,
} from '@edfi/metaed-plugin-edfi-meadowlark';
import { extractDocumentReferences } from '../../src/validation/DocumentReferenceExtractor';
import { extractDocumentIdentity } from '../../src/validation/DocumentIdentityExtractor';
import { DocumentReference } from '../../src/model/DocumentReference';
import { DocumentIdentity, NoDocumentIdentity } from '../../src/model/DocumentIdentity';

describe('when comparing identities with references from domain entity referencing one as identity and another as collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let referenceExtractionResult: DocumentReference[] = [];
  let classPeriodIdentityExtractionResult: DocumentIdentity = NoDocumentIdentity;
  let courseOfferingIdentityExtractionResult: DocumentIdentity = NoDocumentIdentity;

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
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const section = namespace.entity.domainEntity.get('Section');
    referenceExtractionResult = extractDocumentReferences(section, bodyWithReferences);
    const classPeriod = namespace.entity.domainEntity.get('ClassPeriod');
    classPeriodIdentityExtractionResult = extractDocumentIdentity(classPeriod, classPeriodIdentityBody);
    const courseOffering = namespace.entity.domainEntity.get('CourseOffering');
    courseOfferingIdentityExtractionResult = extractDocumentIdentity(courseOffering, courseOfferingIdentityBody);
  });

  it('should have classPeriod reference and identity match', () => {
    const [classPeriodReferenceExtractonResult] = referenceExtractionResult;
    expect(classPeriodReferenceExtractonResult.documentIdentity).toEqual(classPeriodIdentityExtractionResult);
  });

  it('should have courseOffering reference and identity match', () => {
    const [, , courseOfferingReferenceExtractonResult] = referenceExtractionResult;
    expect(courseOfferingReferenceExtractonResult.documentIdentity).toEqual(courseOfferingIdentityExtractionResult);
  });
});

describe('when comparing identities with references with three levels of identities on a collection reference', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let referenceExtractionResult: DocumentReference[] = [];
  let classPeriodIdentityExtractionResult: DocumentIdentity = NoDocumentIdentity;

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
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const section = namespace.entity.domainEntity.get('Section');
    referenceExtractionResult = extractDocumentReferences(section, bodyWithReferences);
    const classPeriod = namespace.entity.domainEntity.get('ClassPeriod');
    classPeriodIdentityExtractionResult = extractDocumentIdentity(classPeriod, classPeriodIdentityBody);
  });

  it('should have classPeriod reference and identity match', () => {
    const [classPeriodReferenceExtractonResult] = referenceExtractionResult;
    expect(classPeriodReferenceExtractonResult.documentIdentity).toEqual(classPeriodIdentityExtractionResult);
  });
});

describe('when comparing identities with references with two levels of identities with a merge on School', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let referenceExtractionResult: DocumentReference[] = [];
  let classPeriodIdentityExtractionResult: DocumentIdentity = NoDocumentIdentity;

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
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const section = namespace.entity.domainEntity.get('Section');
    referenceExtractionResult = extractDocumentReferences(section, bodyWithReferences);
    const classPeriod = namespace.entity.domainEntity.get('ClassPeriod');
    classPeriodIdentityExtractionResult = extractDocumentIdentity(classPeriod, classPeriodIdentityBody);
  });

  it('should have classPeriod reference and identity match', () => {
    const [classPeriodReferenceExtractonResult] = referenceExtractionResult;
    expect(classPeriodReferenceExtractonResult.documentIdentity).toEqual(classPeriodIdentityExtractionResult);
  });
});

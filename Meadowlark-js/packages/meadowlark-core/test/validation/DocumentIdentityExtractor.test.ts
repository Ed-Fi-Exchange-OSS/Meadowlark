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
import { extractDocumentIdentity, DocumentIdentityWithSecurity } from '../../src/validation/DocumentIdentityExtractor';

describe('when extracting natural key from domain entity referencing another referencing another with identity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentIdentityWithSecurity | null = null;

  const body = {
    notImportant: false,
    sectionIdentifier: 'Bob',
    courseOfferingReference: {
      localCourseCode: 'abc',
      schoolId: '23',
    },
    classPeriodReference: {
      schoolId: '23',
      classPeriodName: 'z',
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityIdentity('CourseOffering', 'doc')
      .withDomainEntityIdentity('ClassPeriod', 'doc')
      .withBooleanProperty('NotImportant', 'doc', true, false)
      .withEndDomainEntity()

      .withStartDomainEntity('CourseOffering')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
      .withDomainEntityIdentity('School', 'doc')
      .withBooleanProperty('AlsoNotImportant', 'doc', true, true)
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
    result = extractDocumentIdentity(section, body);
  });

  it('should be correct', () => {
    expect(result?.documentIdentity).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "classPeriodReference.classPeriodName",
          "value": "z",
        },
        Object {
          "name": "classPeriodReference.schoolId",
          "value": "23",
        },
        Object {
          "name": "courseOfferingReference.localCourseCode",
          "value": "abc",
        },
        Object {
          "name": "courseOfferingReference.schoolId",
          "value": "23",
        },
        Object {
          "name": "sectionIdentifier",
          "value": "Bob",
        },
      ]
    `);
  });
});

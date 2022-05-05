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
import { DocumentReference } from '../../src/model/DocumentReference';

describe('when extracting document references from domain entity referencing one as identity and another as collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const body = {
    notImportant: false,
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

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityIdentity('CourseOffering', 'doc')
      .withDomainEntityProperty('ClassPeriod', 'doc', true, true)
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
      .withBooleanProperty('AndAlsoNotImportant', 'doc', true, true)
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
    result = extractDocumentReferences(section, body);
  });

  it('should have references', () => {
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "documentIdentity": Array [
            Object {
              "name": "classPeriodName",
              "value": "z1",
            },
            Object {
              "name": "schoolReference.schoolId",
              "value": "24",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
          "resourceVersion": "",
        },
        Object {
          "documentIdentity": Array [
            Object {
              "name": "classPeriodName",
              "value": "z2",
            },
            Object {
              "name": "schoolReference.schoolId",
              "value": "25",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
          "resourceVersion": "",
        },
        Object {
          "documentIdentity": Array [
            Object {
              "name": "localCourseCode",
              "value": "abc",
            },
            Object {
              "name": "schoolReference.schoolId",
              "value": "23",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "CourseOffering",
          "resourceVersion": "",
        },
      ]
    `);
  });
});

describe('when extracting with optional reference in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const body = {
    sectionIdentifier: 'Bob',
    courseOfferingReference: {
      localCourseCode: 'abc',
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityProperty('CourseOffering', 'doc', false, false)
      .withEndDomainEntity()

      .withStartDomainEntity('CourseOffering')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
      .withBooleanProperty('AlsoNotImportant', 'doc', true, true)
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
    result = extractDocumentReferences(section, body);
  });

  it('should have references', () => {
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "documentIdentity": Array [
            Object {
              "name": "localCourseCode",
              "value": "abc",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "CourseOffering",
          "resourceVersion": "",
        },
      ]
    `);
  });
});

describe('when extracting with optional reference not in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const body = {
    sectionIdentifier: 'Bob',
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityProperty('CourseOffering', 'doc', false, false)
      .withEndDomainEntity()

      .withStartDomainEntity('CourseOffering')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
      .withBooleanProperty('AlsoNotImportant', 'doc', true, true)
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
    result = extractDocumentReferences(section, body);
  });

  it('should have no references', () => {
    expect(result).toMatchInlineSnapshot(`Array []`);
  });
});

describe('when extracting optional collection in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const body = {
    sectionIdentifier: 'Bob',
    classPeriods: [
      {
        classPeriodReference: {
          classPeriodName: 'z1',
        },
      },
      {
        classPeriodReference: {
          classPeriodName: 'z2',
        },
      },
    ],
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityProperty('ClassPeriod', 'doc', false, true)
      .withEndDomainEntity()

      .withStartDomainEntity('ClassPeriod')
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
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
    result = extractDocumentReferences(section, body);
  });

  it('should have references', () => {
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "documentIdentity": Array [
            Object {
              "name": "classPeriodName",
              "value": "z1",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
          "resourceVersion": "",
        },
        Object {
          "documentIdentity": Array [
            Object {
              "name": "classPeriodName",
              "value": "z2",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
          "resourceVersion": "",
        },
      ]
    `);
  });
});

describe('when extracting optional collection not in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const body = {
    sectionIdentifier: 'Bob',
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityProperty('ClassPeriod', 'doc', false, true)
      .withEndDomainEntity()

      .withStartDomainEntity('ClassPeriod')
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
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
    result = extractDocumentReferences(section, body);
  });

  it('should have no references', () => {
    expect(result).toMatchInlineSnapshot(`Array []`);
  });
});

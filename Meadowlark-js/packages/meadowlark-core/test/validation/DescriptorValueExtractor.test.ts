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
  DescriptorBuilder,
  DomainEntitySubclassBuilder,
} from '@edfi/metaed-core';
import { descriptorReferenceEnhancer, domainEntitySubclassBaseClassEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import {
  entityPropertyMeadowlarkDataSetupEnhancer,
  apiEntityMappingEnhancer,
  entityMeadowlarkDataSetupEnhancer,
  referenceComponentEnhancer,
  apiPropertyMappingEnhancer,
  propertyCollectingEnhancer,
  subclassPropertyNamingCollisionEnhancer,
  subclassPropertyCollectingEnhancer,
  subclassApiEntityMappingEnhancer,
} from '@edfi/metaed-plugin-edfi-meadowlark';

import { extractDescriptorValues } from '../../src/validation/DescriptorValueExtractor';
import { DocumentReference } from '../../src/model/DocumentReference';

describe('when extracting single descriptor value from domain entity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const descriptorValue = 'uri://ed-fi.org/grade';

  const body = {
    periodSequence: 123,
    gradingPeriodDescriptor: descriptorValue,
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('EntityName')
      .withDocumentation('doc')
      .withIntegerIdentity('PeriodSequence', 'doc', '30')
      .withDescriptorProperty('GradingPeriod', 'doc', true, false)
      .withEndDomainEntity()

      .withStartDescriptor('GradingPeriod')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    descriptorReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    subclassPropertyNamingCollisionEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const entity = namespace.entity.domainEntity.get('EntityName');
    result = extractDescriptorValues(entity, body);
  });

  it('should have the descriptor value for a GradingPeriod', () => {
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/grade",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "GradingPeriodDescriptor",
          "resourceVersion": "",
        },
      ]
    `);
  });
});

describe('when extracting descriptor values from domain entity with the same names', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const gradingPeriod = 'GradingPeriod';
  const descriptorValue = 'uri://ed-fi.org/grade';

  const body = {
    periodSequence: 123,
    gradingPeriodDescriptor: descriptorValue,
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity(gradingPeriod)
      .withDocumentation('doc')
      .withIntegerIdentity('PeriodSequence', 'doc', '30')
      .withDescriptorProperty(gradingPeriod, 'doc', true, false)
      .withEndDomainEntity()

      .withStartDescriptor(gradingPeriod)
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    descriptorReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    subclassPropertyNamingCollisionEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const entity = namespace.entity.domainEntity.get(gradingPeriod);
    result = extractDescriptorValues(entity, body);
  });

  it('should have the descriptor value for a GradingPeriod', () => {
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/grade",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "GradingPeriodDescriptor",
          "resourceVersion": "",
        },
      ]
    `);
  });
});

describe('when extracting array of descriptor values from domain entity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const descriptorValue = 'uri://ed-fi.org/grade';

  const body = {
    periodSequence: 123,
    gradingPeriods: [
      {
        gradingPeriodDescriptor: `${descriptorValue}1`,
      },
      {
        gradingPeriodDescriptor: `${descriptorValue}2`,
      },
      {
        gradingPeriodDescriptor: `${descriptorValue}3`,
      },
    ],
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('EntityName')
      .withDocumentation('doc')
      .withIntegerIdentity('PeriodSequence', 'doc', '30')
      .withDescriptorProperty('GradingPeriod', 'doc', true, true)
      .withEndDomainEntity()

      .withStartDescriptor('GradingPeriod')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    descriptorReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    subclassPropertyNamingCollisionEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const entity = namespace.entity.domainEntity.get('EntityName');
    result = extractDescriptorValues(entity, body);
  });

  it('should have the descriptor values for the GradingPeriods', () => {
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/grade1",
            },
          ],
          "isAssignableFrom": false,
          "metaEdName": "GradingPeriod",
          "metaEdType": "descriptor",
        },
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/grade2",
            },
          ],
          "isAssignableFrom": false,
          "metaEdName": "GradingPeriod",
          "metaEdType": "descriptor",
        },
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/grade3",
            },
          ],
          "isAssignableFrom": false,
          "metaEdName": "GradingPeriod",
          "metaEdType": "descriptor",
        },
      ]
    `);
  });
});

describe('when extracting collection from domain entity subclass with naming collision issue', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const body = {
    identity: 123,
    educationOrganizationCategories: [
      {
        educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/edOrgValue',
      },
    ],
    schoolCategories: [
      {
        schoolCategoryDescriptor: 'uri://ed-fi.org/schoolValue',
      },
    ],
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartAbstractEntity('EducationOrganization')
      .withDocumentation('doc')
      .withIntegerIdentity('Identity', 'doc')
      .withDescriptorProperty('EducationOrganizationCategory', 'doc', true, true)
      .withEndAbstractEntity()

      .withStartDomainEntitySubclass('School', 'EducationOrganization')
      .withDocumentation('doc')
      .withDescriptorProperty('SchoolCategory', 'doc', true, true)
      .withEndDomainEntity()

      .withStartDescriptor('EducationOrganizationCategory')
      .withDocumentation('doc')
      .withEndDescriptor()

      .withStartDescriptor('SchoolCategory')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    descriptorReferenceEnhancer(metaEd);
    domainEntitySubclassBaseClassEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    subclassPropertyNamingCollisionEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    subclassPropertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    subclassApiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const entity = namespace.entity.domainEntitySubclass.get('School');
    result = extractDescriptorValues(entity, body);
  });

  it('should have values for body without collection prefix removal', () => {
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/schoolValue",
            },
          ],
          "isAssignableFrom": false,
          "metaEdName": "SchoolCategory",
          "metaEdType": "descriptor",
        },
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/edOrgValue",
            },
          ],
          "isAssignableFrom": false,
          "metaEdName": "EducationOrganizationCategory",
          "metaEdType": "descriptor",
        },
      ]
    `);
  });
});

describe('when extracting collection from domain entity subclass with no naming collision issue due to one being a non-collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
  let result: DocumentReference[] = [];

  const body = {
    identity: 123,
    categories: [
      {
        educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/edOrgValue',
      },
    ],
    schoolCategoryDescriptor: 'uri://ed-fi.org/schoolValue',
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartAbstractEntity('EducationOrganization')
      .withDocumentation('doc')
      .withIntegerIdentity('Identity', 'doc')
      .withDescriptorProperty('EducationOrganizationCategory', 'doc', true, true)
      .withEndAbstractEntity()

      .withStartDomainEntitySubclass('School', 'EducationOrganization')
      .withDocumentation('doc')
      .withDescriptorProperty('SchoolCategory', 'doc', true, false)
      .withEndDomainEntity()

      .withStartDescriptor('EducationOrganizationCategory')
      .withDocumentation('doc')
      .withEndDescriptor()

      .withStartDescriptor('SchoolCategory')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    descriptorReferenceEnhancer(metaEd);
    domainEntitySubclassBaseClassEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    subclassPropertyNamingCollisionEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    subclassPropertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    subclassApiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const entity = namespace.entity.domainEntitySubclass.get('School');
    result = extractDescriptorValues(entity, body);
  });

  it('should have values for body with collection prefix removal and without collection', () => {
    expect(result).toMatchInlineSnapshot(`
      Array [
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/schoolValue",
            },
          ],
          "isAssignableFrom": false,
          "projectName": "EdFi",
          "resourceName": "SchoolCategoryDescriptor",
          "resourceVersion": "",
        },
        Object {
          "documentIdentity": Array [
            Object {
              "name": "descriptor",
              "value": "uri://ed-fi.org/edOrgValue",
            },
          ],
          "isAssignableFrom": false,
          "metaEdName": "EducationOrganizationCategory",
          "metaEdType": "descriptor",
        },
      ]
    `);
  });
});

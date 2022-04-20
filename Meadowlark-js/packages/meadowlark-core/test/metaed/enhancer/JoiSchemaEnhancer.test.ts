// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-underscore-dangle */
import {
  newMetaEdEnvironment,
  MetaEdEnvironment,
  DomainEntityBuilder,
  ChoiceBuilder,
  CommonBuilder,
  MetaEdTextBuilder,
  NamespaceBuilder,
} from '@edfi/metaed-core';
import {
  domainEntityReferenceEnhancer,
  choiceReferenceEnhancer,
  inlineCommonReferenceEnhancer,
} from '@edfi/metaed-plugin-edfi-unified';
import { enhance as entityPropertyMeadowlarkDataSetupEnhancer } from '../../../src/metaed/model/EntityPropertyMeadowlarkData';
import {
  enhance as entityMeadowlarkDataSetupEnhancer,
  EntityMeadowlarkData,
} from '../../../src/metaed/model/EntityMeadowlarkData';
import { enhance as referenceComponentEnhancer } from '../../../src/metaed/enhancer/ReferenceComponentEnhancer';
import { enhance as apiPropertyMappingEnhancer } from '../../../src/metaed/enhancer/ApiPropertyMappingEnhancer';
import { enhance as apiEntityMappingEnhancer } from '../../../src/metaed/enhancer/ApiEntityMappingEnhancer';
import { enhance as propertyCollectingEnhancer } from '../../../src/metaed/enhancer/PropertyCollectingEnhancer';
import { enhance } from '../../../src/metaed/enhancer/JoiSchemaEnhancer';
import { expectSubschemas, expectSubschemaReferenceArray, expectSubschemaScalarArray } from './JoiTestHelper';
import { validate } from './JoiTestValidator';

describe('when building simple domain entity referencing another referencing another with identity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  const domainEntityName = 'DomainEntityName';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity(domainEntityName)
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

    namespace = metaEd.namespace.get(namespaceName);

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    const { joiSchema } = entity.data.meadowlark as EntityMeadowlarkData;

    const [, courseOfferingReferenceSchema, classPeriodSchema] = expectSubschemas(joiSchema, [
      { name: 'sectionIdentifier', presence: 'required', type: 'string' },
      { name: 'courseOfferingReference', presence: 'required', type: 'object' },
      { name: 'classPeriods', presence: 'required', type: 'array' },
    ]);

    expectSubschemas(courseOfferingReferenceSchema, [
      { name: 'localCourseCode', presence: 'required', type: 'string' },
      { name: 'schoolId', presence: 'required', type: 'string' },
    ]);

    const classPeriodReferenceSchema = expectSubschemaReferenceArray(classPeriodSchema, {
      name: 'classPeriodReference',
      presence: 'required',
      type: 'object',
    });

    expectSubschemas(classPeriodReferenceSchema, [
      { name: 'classPeriodName', presence: 'required', type: 'string' },
      { name: 'schoolId', presence: 'required', type: 'string' },
    ]);
  });

  it('should validate body', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    expect((entity.data.meadowlark as EntityMeadowlarkData).joiSchema).toBeDefined();

    const body = {
      sectionIdentifier: 'Bob',
      courseOfferingReference: {
        localCourseCode: 'abc',
        schoolId: '23',
      },
      classPeriods: [
        {
          classPeriodReference: {
            schoolId: '23',
            classPeriodName: 'z',
          },
        },
      ],
    };

    validate((entity.data.meadowlark as EntityMeadowlarkData).joiSchema, [[body, true]]);
  });
});

describe('when building domain entity with nested choice and inline commons', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  const domainEntityName = 'EducationContent';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity(domainEntityName)
      .withDocumentation('doc')
      .withStringIdentity('ContentIdentifier', 'doc', '30')
      .withChoiceProperty('LearningResourceChoice', 'doc', true, false)
      .withEndDomainEntity()

      .withStartChoice('LearningResourceChoice')
      .withDocumentation('doc')
      .withStringProperty('LearningResourceMetadataURI', 'doc', true, false, '30')
      .withInlineCommonProperty('LearningResource', 'doc', true, false)
      .withEndChoice()

      .withStartInlineCommon('LearningResource')
      .withDocumentation('doc')
      .withStringProperty('Description', 'doc', false, false, '30')
      .withInlineCommonProperty('EducationContentSource', 'doc', false, false, 'DerivativeSource')
      .withEndInlineCommon()

      .withStartInlineCommon('EducationContentSource')
      .withDocumentation('doc')
      .withDomainEntityProperty('EducationContent', 'doc', false, true)
      .withStringProperty('URI', 'doc', false, true, '30')
      .withEndDomainEntity()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new ChoiceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    domainEntityReferenceEnhancer(metaEd);
    choiceReferenceEnhancer(metaEd);
    inlineCommonReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    const { joiSchema } = entity.data.meadowlark as EntityMeadowlarkData;

    const [, , , derivativeSourceEducationContentSchema, derivativeSourceURISchema] = expectSubschemas(joiSchema, [
      { name: 'contentIdentifier', presence: 'required', type: 'string' },
      { name: 'learningResourceMetadataURI', presence: 'required', type: 'string' },
      { name: 'description', presence: 'optional', type: 'string' },
      { name: 'derivativeSourceEducationContents', presence: 'optional', type: 'array' },
      { name: 'derivativeSourceURIs', presence: 'optional', type: 'array' },
    ]);

    const derivativeSourceEducationContentReferenceSchema = expectSubschemaReferenceArray(
      derivativeSourceEducationContentSchema,
      {
        name: 'derivativeSourceEducationContentReference',
        presence: 'required',
        type: 'object',
      },
    );

    expectSubschemas(derivativeSourceEducationContentReferenceSchema, [
      { name: 'contentIdentifier', presence: 'optional', type: 'string' },
    ]);

    expectSubschemaScalarArray(derivativeSourceURISchema, {
      name: 'derivativeSourceURI',
      presence: 'optional',
      type: 'string',
    });
  });
});

describe('when building domain entity with non-Association/DomainEntity collection named with prefix of parent entity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  const domainEntityName = 'EducationContent';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity(domainEntityName)
      .withDocumentation('doc')
      .withStringIdentity('ContentIdentifier', 'doc', '30')
      .withStringProperty(`${domainEntityName}SuffixName`, 'doc', true, true, '30')
      .withEndDomainEntity()
      .withEndNamespace()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema - parent name prefix removed', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    const { joiSchema } = entity.data.meadowlark as EntityMeadowlarkData;

    expectSubschemas(joiSchema, [
      { name: 'contentIdentifier', presence: 'required', type: 'string' },
      { name: 'suffixNames', presence: 'required', type: 'array' },
    ]);
  });
});

describe('when building domain entity with Association/DomainEntity collection named with prefix of parent entity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  const domainEntityName = 'EducationContent';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity(domainEntityName)
      .withDocumentation('doc')
      .withStringIdentity('ContentIdentifier', 'doc', '30')
      .withDomainEntityProperty(`${domainEntityName}SuffixName`, 'doc', true, true)
      .withEndDomainEntity()

      .withStartDomainEntity(`${domainEntityName}SuffixName`)
      .withDocumentation('doc')
      .withStringIdentity('StringIdentity', 'doc', '30')
      .withEndDomainEntity()
      .withEndNamespace()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema - parent name prefix retained', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    const { joiSchema } = entity.data.meadowlark as EntityMeadowlarkData;

    expectSubschemas(joiSchema, [
      { name: 'contentIdentifier', presence: 'required', type: 'string' },
      { name: 'educationContentSuffixNames', presence: 'required', type: 'array' },
    ]);
  });
});

describe('when building domain entity with an enumeration with the name SchoolYear', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  const domainEntityName = 'EducationContent';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity(domainEntityName)
      .withDocumentation('doc')
      .withStringIdentity('ContentIdentifier', 'doc', '30')
      .withEnumerationProperty('SchoolYear', 'doc', true, false)
      .withEndDomainEntity()
      .withEndNamespace()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should validate the SchoolYear enumeration', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    const { joiSchema } = entity.data.meadowlark as EntityMeadowlarkData;
    expectSubschemas(joiSchema, [
      { name: 'contentIdentifier', presence: 'required', type: 'string' },
      { name: 'schoolYear', presence: 'required', type: 'number' },
    ]);
  });

  it('should have the correct SchoolYear range', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    const { joiSchema } = entity.data.meadowlark as EntityMeadowlarkData;
    const subschemas: any[] = [...(joiSchema as any)._ids._byKey.values()];
    expect(subschemas[1].id).toBe('schoolYear');

    const schoolYearSchema: any = subschemas[1].schema;

    const minRule = schoolYearSchema._rules[0];
    expect(minRule.name).toBe('min');
    expect(minRule.args.limit).toBe(1900);

    const maxRule = schoolYearSchema._rules[1];
    expect(maxRule.name).toBe('max');
    expect(maxRule.args.limit).toBe(2100);
  });
});

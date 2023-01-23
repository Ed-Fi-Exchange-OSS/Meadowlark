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
  DomainEntitySubclassBuilder,
  CommonBuilder,
} from '@edfi/metaed-core';
import { domainEntityReferenceEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import { enhance as entityPropertyMeadowlarkDataSetupEnhancer } from '../../src/model/EntityPropertyMeadowlarkData';
import { enhance as entityMeadowlarkDataSetupEnhancer } from '../../src/model/EntityMeadowlarkData';
import { enhance as referenceComponentEnhancer } from '../../src/enhancer/ReferenceComponentEnhancer';
import { enhance } from '../../src/enhancer/ApiPropertyMappingEnhancer';

describe('when building simple domain entity referencing another referencing another with identity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();

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
    enhance(metaEd);
  });

  it('should be valid', () => {
    expect(metaEd.propertyIndex.string).toHaveLength(4);
    expect(metaEd.propertyIndex.string[0].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "sectionIdentifier",
        "descriptorCollectionName": "",
        "fullName": "sectionIdentifier",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "SectionIdentifier",
        "metaEdType": "string",
        "referenceCollectionName": "",
        "topLevelName": "sectionIdentifier",
      }
    `);
    expect(metaEd.propertyIndex.string[1].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "localCourseCode",
        "descriptorCollectionName": "",
        "fullName": "localCourseCode",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "LocalCourseCode",
        "metaEdType": "string",
        "referenceCollectionName": "",
        "topLevelName": "localCourseCode",
      }
    `);
    expect(metaEd.propertyIndex.string[2].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "classPeriodName",
        "descriptorCollectionName": "",
        "fullName": "classPeriodName",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "ClassPeriodName",
        "metaEdType": "string",
        "referenceCollectionName": "",
        "topLevelName": "classPeriodName",
      }
    `);
    expect(metaEd.propertyIndex.string[3].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "schoolId",
        "descriptorCollectionName": "",
        "fullName": "schoolId",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "SchoolId",
        "metaEdType": "string",
        "referenceCollectionName": "",
        "topLevelName": "schoolId",
      }
    `);

    expect(metaEd.propertyIndex.domainEntity).toHaveLength(4);
    expect(metaEd.propertyIndex.domainEntity[0].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "courseOfferingReference",
        "descriptorCollectionName": "",
        "fullName": "courseOffering",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": true,
        "metaEdName": "CourseOffering",
        "metaEdType": "domainEntity",
        "referenceCollectionName": "",
        "topLevelName": "courseOfferingReference",
      }
    `);
    expect(metaEd.propertyIndex.domainEntity[1].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "classPeriods",
        "descriptorCollectionName": "",
        "fullName": "classPeriods",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": true,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "ClassPeriod",
        "metaEdType": "domainEntity",
        "referenceCollectionName": "classPeriodReference",
        "topLevelName": "classPeriods",
      }
    `);
    expect(metaEd.propertyIndex.domainEntity[2].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "schoolReference",
        "descriptorCollectionName": "",
        "fullName": "school",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": true,
        "metaEdName": "School",
        "metaEdType": "domainEntity",
        "referenceCollectionName": "",
        "topLevelName": "schoolReference",
      }
    `);
    expect(metaEd.propertyIndex.domainEntity[3].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "schoolReference",
        "descriptorCollectionName": "",
        "fullName": "school",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": true,
        "metaEdName": "School",
        "metaEdType": "domainEntity",
        "referenceCollectionName": "",
        "topLevelName": "schoolReference",
      }
    `);
  });
});

describe('when domain entity has a reference with same role name as entity name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();

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
      .withDomainEntityIdentity('School', 'doc', 'School')
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
    enhance(metaEd);
  });

  it('should be valid', () => {
    expect(metaEd.propertyIndex.string).toHaveLength(4);
    expect(metaEd.propertyIndex.string[0].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "sectionIdentifier",
        "descriptorCollectionName": "",
        "fullName": "sectionIdentifier",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "SectionIdentifier",
        "metaEdType": "string",
        "referenceCollectionName": "",
        "topLevelName": "sectionIdentifier",
      }
    `);
    expect(metaEd.propertyIndex.string[1].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "localCourseCode",
        "descriptorCollectionName": "",
        "fullName": "localCourseCode",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "LocalCourseCode",
        "metaEdType": "string",
        "referenceCollectionName": "",
        "topLevelName": "localCourseCode",
      }
    `);
    expect(metaEd.propertyIndex.string[2].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "classPeriodName",
        "descriptorCollectionName": "",
        "fullName": "classPeriodName",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "ClassPeriodName",
        "metaEdType": "string",
        "referenceCollectionName": "",
        "topLevelName": "classPeriodName",
      }
    `);
    expect(metaEd.propertyIndex.string[3].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "schoolId",
        "descriptorCollectionName": "",
        "fullName": "schoolId",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "SchoolId",
        "metaEdType": "string",
        "referenceCollectionName": "",
        "topLevelName": "schoolId",
      }
    `);

    expect(metaEd.propertyIndex.domainEntity).toHaveLength(4);
    expect(metaEd.propertyIndex.domainEntity[0].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "courseOfferingReference",
        "descriptorCollectionName": "",
        "fullName": "courseOffering",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": true,
        "metaEdName": "CourseOffering",
        "metaEdType": "domainEntity",
        "referenceCollectionName": "",
        "topLevelName": "courseOfferingReference",
      }
    `);
    expect(metaEd.propertyIndex.domainEntity[1].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "classPeriods",
        "descriptorCollectionName": "",
        "fullName": "classPeriods",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": true,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "ClassPeriod",
        "metaEdType": "domainEntity",
        "referenceCollectionName": "classPeriodReference",
        "topLevelName": "classPeriods",
      }
    `);
    expect(metaEd.propertyIndex.domainEntity[2].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "schoolReference",
        "descriptorCollectionName": "",
        "fullName": "school",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": true,
        "metaEdName": "School",
        "metaEdType": "domainEntity",
        "referenceCollectionName": "",
        "topLevelName": "schoolReference",
      }
    `);
    expect(metaEd.propertyIndex.domainEntity[3].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "schoolReference",
        "descriptorCollectionName": "",
        "fullName": "school",
        "isCommonCollection": false,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": true,
        "metaEdName": "School",
        "metaEdType": "domainEntity",
        "referenceCollectionName": "",
        "topLevelName": "schoolReference",
      }
    `);
  });
});

describe('when superclass and subclass will have a naming collision issue', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';
  const educationOrganization = 'EducationOrganization';
  const school = 'School';
  const category = 'Category';

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartAbstractEntity(educationOrganization)
      .withDocumentation('doc')
      .withIntegerIdentity('Identity', 'doc')
      .withStringProperty(`${educationOrganization}${category}`, 'doc', true, true, '30')
      .withEndAbstractEntity()

      .withStartDomainEntitySubclass(school, educationOrganization)
      .withDocumentation('doc')
      .withStringProperty(`${school}${category}`, 'doc', true, true, '30')
      .withEndDomainEntitySubclass()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []));

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should have correct regular and collision resolved top level names', () => {
    expect(metaEd.propertyIndex.string).toHaveLength(2);
    const edOrgPropertyApiMapping = metaEd.propertyIndex.string[0].data.meadowlark.apiMapping;
    expect(edOrgPropertyApiMapping.decollisionedTopLevelName).toBe('educationOrganizationCategories');
    expect(edOrgPropertyApiMapping.topLevelName).toBe('categories');

    const schoolPropertyApiMapping = metaEd.propertyIndex.string[1].data.meadowlark.apiMapping;
    expect(schoolPropertyApiMapping.decollisionedTopLevelName).toBe('schoolCategories');
    expect(schoolPropertyApiMapping.topLevelName).toBe('categories');
  });
});

describe('when building simple domain entity with common collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('ClassPeriod')
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
      .withCommonProperty('MeetingTime', 'doc', false, true)
      .withEndDomainEntity()

      .withStartCommon('MeetingTime')
      .withIntegerIdentity('StartTime', 'doc')
      .withEndCommon()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be valid', () => {
    expect(metaEd.propertyIndex.common).toHaveLength(1);
    expect(metaEd.propertyIndex.common[0].data.meadowlark.apiMapping).toMatchInlineSnapshot(`
      {
        "decollisionedTopLevelName": "meetingTimes",
        "descriptorCollectionName": "",
        "fullName": "meetingTimes",
        "isCommonCollection": true,
        "isDescriptorCollection": false,
        "isReferenceCollection": false,
        "isScalarCommon": false,
        "isScalarReference": false,
        "metaEdName": "MeetingTime",
        "metaEdType": "unknown",
        "referenceCollectionName": "",
        "topLevelName": "meetingTimes",
      }
    `);
  });
});

describe('when building a domain entity with a descriptor collection that meets prefix removal conditions', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let gradeLevelDescriptorApiName: any = null;
  let meadowlarkData: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('LearningObjective')
      .withDocumentation('doc')
      .withStringIdentity('LearningObjectiveId', 'doc', '0z41dmrtgsm4wqbwv3k0v5vkbdurrgeu')
      .withDescriptorProperty('GradeLevel', 'doc', false, true, 'Objective')
      .withEndDomainEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    enhance(metaEd);

    meadowlarkData = metaEd.propertyIndex.descriptor[0].data.meadowlark;
  });

  it('should have the prefix removed from the name', () => {
    gradeLevelDescriptorApiName = meadowlarkData.apiMapping.fullName;
    expect(gradeLevelDescriptorApiName).toEqual('gradeLevels');
  });
});

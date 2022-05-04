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
  CommonBuilder,
} from '@edfi/metaed-core';
import { domainEntityReferenceEnhancer, inlineCommonReferenceEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import { enhance as entityPropertyMeadowlarkDataSetupEnhancer } from '../../src/model/EntityPropertyMeadowlarkData';
import { enhance as entityMeadowlarkDataSetupEnhancer } from '../../src/model/EntityMeadowlarkData';
import { enhance as referenceComponentEnhancer } from '../../src/enhancer/ReferenceComponentEnhancer';
import { enhance as apiPropertyMappingEnhancer } from '../../src/enhancer/ApiPropertyMappingEnhancer';
import { enhance as propertyCollectingEnhancer } from '../../src/enhancer/PropertyCollectingEnhancer';
import { enhance } from '../../src/enhancer/ApiEntityMappingEnhancer';

describe('when demonstrating key unification via entity referencing two entities each referencing a 3rd as their identity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';
  const section = 'Section';
  const courseOffering = 'CourseOffering';
  const classPeriod = 'ClassPeriod';
  const school = 'School';

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartDomainEntity(section)
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDomainEntityIdentity(courseOffering, 'doc')
      .withDomainEntityProperty(classPeriod, 'doc', true, true)
      .withEndDomainEntity()

      .withStartDomainEntity(courseOffering)
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
      .withDomainEntityIdentity(school, 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity(classPeriod)
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
      .withDomainEntityIdentity(school, 'doc')
      .withEndDomainEntity()

      .withStartDomainEntity(school)
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
    enhance(metaEd);
  });

  it('should have ClassPeriod and CourseOffering in Section reference groups', () => {
    const sectionEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(section);
    const apiMapping = sectionEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.referenceGroups).toHaveLength(2);
    expect(apiMapping?.referenceGroups[0].isGroup).toBe(true);
    expect(apiMapping?.referenceGroups[0].sourceProperty.fullPropertyName).toBe(classPeriod);
    expect(apiMapping?.referenceGroups[1].isGroup).toBe(true);
    expect(apiMapping?.referenceGroups[1].sourceProperty.fullPropertyName).toBe(courseOffering);
  });

  it('should have Course Offering reference group and Section Identifier reference element in Section identity reference components', () => {
    const sectionEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(section);
    const apiMapping = sectionEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.identityReferenceComponents).toHaveLength(2);
    expect(apiMapping?.identityReferenceComponents[0].isGroup).toBe(true);
    expect(apiMapping?.identityReferenceComponents[0].sourceProperty.fullPropertyName).toBe(courseOffering);

    expect(apiMapping?.identityReferenceComponents[1].isElement).toBe(true);
    expect(apiMapping?.identityReferenceComponents[1].sourceProperty.fullPropertyName).toBe('SectionIdentifier');
  });

  it('should have LocalCourseCode, SchoolId, and SectionIdentifier in Section flattened identity properties', () => {
    const sectionEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(section);
    const apiMapping = sectionEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.flattenedIdentityProperties).toHaveLength(3);
    expect(apiMapping?.flattenedIdentityProperties[0].fullPropertyName).toBe('LocalCourseCode');
    expect(apiMapping?.flattenedIdentityProperties[1].fullPropertyName).toBe('SchoolId');
    expect(apiMapping?.flattenedIdentityProperties[2].fullPropertyName).toBe('SectionIdentifier');
  });

  it('should not have any descriptor property mappings in Section', () => {
    const sectionEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(section);
    const apiMapping = sectionEntity?.data.meadowlark.apiMapping;
    expect(apiMapping?.descriptorCollectedProperties).toHaveLength(0);
  });

  it('should have School in CourseOffering reference groups', () => {
    const courseOfferingEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(courseOffering);
    const apiMapping = courseOfferingEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.referenceGroups).toHaveLength(1);
    expect(apiMapping?.referenceGroups[0].isGroup).toBe(true);
    expect(apiMapping?.referenceGroups[0].sourceProperty.fullPropertyName).toBe(school);
  });

  it('should have LocalCourseCode reference element and School reference group in CourseOffering identity reference components', () => {
    const courseOfferingEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(courseOffering);
    const apiMapping = courseOfferingEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.identityReferenceComponents).toHaveLength(2);
    expect(apiMapping?.identityReferenceComponents[0].isElement).toBe(true);
    expect(apiMapping?.identityReferenceComponents[0].sourceProperty.fullPropertyName).toBe('LocalCourseCode');

    expect(apiMapping?.identityReferenceComponents[1].isGroup).toBe(true);
    expect(apiMapping?.identityReferenceComponents[1].sourceProperty.fullPropertyName).toBe(school);
  });

  it('should have LocalCourseCode and SchoolId in CourseOffering flattened identity properties', () => {
    const courseOfferingEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(courseOffering);
    const apiMapping = courseOfferingEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.flattenedIdentityProperties).toHaveLength(2);
    expect(apiMapping?.flattenedIdentityProperties[0].fullPropertyName).toBe('LocalCourseCode');
    expect(apiMapping?.flattenedIdentityProperties[1].fullPropertyName).toBe('SchoolId');
  });

  it('should not have any descriptor property mappings in CourseOffering', () => {
    const courseOfferingEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(courseOffering);
    const apiMapping = courseOfferingEntity?.data.meadowlark.apiMapping;
    expect(apiMapping?.descriptorCollectedProperties).toHaveLength(0);
  });

  it('should have School in ClassPeriod reference groups', () => {
    const classPeriodEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(classPeriod);
    const apiMapping = classPeriodEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.referenceGroups).toHaveLength(1);
    expect(apiMapping?.referenceGroups[0].isGroup).toBe(true);
    expect(apiMapping?.referenceGroups[0].sourceProperty.fullPropertyName).toBe(school);
  });

  it('should have School reference group and ClassPeriodName reference element in ClassPeriod identity reference components', () => {
    const classPeriodEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(classPeriod);
    const apiMapping = classPeriodEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.identityReferenceComponents).toHaveLength(2);
    expect(apiMapping?.identityReferenceComponents[0].isElement).toBe(true);
    expect(apiMapping?.identityReferenceComponents[0].sourceProperty.fullPropertyName).toBe('ClassPeriodName');

    expect(apiMapping?.identityReferenceComponents[1].isGroup).toBe(true);
    expect(apiMapping?.identityReferenceComponents[1].sourceProperty.fullPropertyName).toBe(school);
  });

  it('should have ClassPeriodName and SchoolId in ClassPeriod flattened identity properties', () => {
    const classPeriodEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(classPeriod);
    const apiMapping = classPeriodEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.flattenedIdentityProperties).toHaveLength(2);
    expect(apiMapping?.flattenedIdentityProperties[0].fullPropertyName).toBe('ClassPeriodName');
    expect(apiMapping?.flattenedIdentityProperties[1].fullPropertyName).toBe('SchoolId');
  });

  it('should not have any descriptor property mappings in ClassPeriod', () => {
    const classPeriodEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(classPeriod);
    const apiMapping = classPeriodEntity?.data.meadowlark.apiMapping;
    expect(apiMapping?.descriptorCollectedProperties).toHaveLength(0);
  });

  it('should no reference groups in School', () => {
    const schoolEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(school);
    const apiMapping = schoolEntity?.data.meadowlark.apiMapping;
    expect(apiMapping?.referenceGroups).toHaveLength(0);
  });

  it('should have SchoolId reference element in School identity reference components', () => {
    const schoolEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(school);
    const apiMapping = schoolEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.identityReferenceComponents).toHaveLength(1);
    expect(apiMapping?.identityReferenceComponents[0].isElement).toBe(true);
    expect(apiMapping?.identityReferenceComponents[0].sourceProperty.fullPropertyName).toBe('SchoolId');
  });

  it('should have SchoolId in School flattened identity properties', () => {
    const schoolEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(school);
    const apiMapping = schoolEntity?.data.meadowlark.apiMapping;

    expect(apiMapping?.flattenedIdentityProperties).toHaveLength(1);
    expect(apiMapping?.flattenedIdentityProperties[0].fullPropertyName).toBe('SchoolId');
  });

  it('should not have any descriptor property mappings in School', () => {
    const schoolEntity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(school);
    const apiMapping = schoolEntity?.data.meadowlark.apiMapping;
    expect(apiMapping?.descriptorCollectedProperties).toHaveLength(0);
  });
});

describe('when demonstrating descriptor collections and scalar descriptors on one entity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';
  const resourceName = 'EntityName';
  const descriptorName = 'DescriptorName';
  const singlePrefix = 'Single';

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartDomainEntity(resourceName)
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withDescriptorProperty(descriptorName, 'doc', true, true)
      .withDescriptorProperty(descriptorName, 'doc', true, false, singlePrefix)
      .withEndDomainEntity()

      .withStartDescriptor(descriptorName)
      .withDocumentation('doc')
      .withEndDescriptor()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should have two descriptor collected properties', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(resourceName);
    const collectedProperties = entity?.data.meadowlark.apiMapping.descriptorCollectedProperties;

    expect(collectedProperties).toHaveLength(2);
  });

  it('should have one collection collected property', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(resourceName);
    const collectedProperties = entity?.data.meadowlark.apiMapping.descriptorCollectedProperties;

    expect(collectedProperties[0].property.type).toBe('descriptor');
    expect(collectedProperties[0].property.metaEdName).toBe(descriptorName);
    expect(collectedProperties[0].property.isRequiredCollection).toBe(true);
    expect(collectedProperties[0].propertyModifier.optionalDueToParent).toBe(false);
    expect(collectedProperties[0].propertyModifier.parentPrefixes).toHaveLength(0);
  });

  it('should have one scalar collected property', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(resourceName);
    const collectedProperties = entity?.data.meadowlark.apiMapping.descriptorCollectedProperties;

    expect(collectedProperties[1].property.type).toBe('descriptor');
    expect(collectedProperties[1].property.metaEdName).toBe(descriptorName);
    expect(collectedProperties[1].property.isRequiredCollection).toBe(false);
    expect(collectedProperties[1].propertyModifier.optionalDueToParent).toBe(false);
    expect(collectedProperties[1].propertyModifier.parentPrefixes).toHaveLength(0);
  });
});

describe('when one entity has a descriptor on an inline common reference', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';
  const resourceName = 'EntityName';
  const inlineCommonName = 'InlineCommonName';
  const descriptorName = 'DescriptorName';

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartDomainEntity(resourceName)
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withInlineCommonProperty(inlineCommonName, 'doc', true, false)
      .withEndDomainEntity()

      .withStartInlineCommon(inlineCommonName)
      .withDocumentation('doc')
      .withDescriptorProperty(descriptorName, 'doc', true, false)
      .withEndInlineCommon()

      .withStartDescriptor(descriptorName)
      .withDocumentation('doc')
      .withEndDescriptor()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    inlineCommonReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should have one descriptor collected property', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(resourceName);
    const collectedProperties = entity?.data.meadowlark.apiMapping.descriptorCollectedProperties;

    expect(collectedProperties).toHaveLength(1);
  });

  it('should have correct collected property values', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(resourceName);
    const collectedProperties = entity?.data.meadowlark.apiMapping.descriptorCollectedProperties;

    expect(collectedProperties[0].property.type).toBe('descriptor');
    expect(collectedProperties[0].property.metaEdName).toBe(descriptorName);
    expect(collectedProperties[0].property.isRequiredCollection).toBe(false);
    expect(collectedProperties[0].propertyModifier.optionalDueToParent).toBe(false);
    expect(collectedProperties[0].propertyModifier.parentPrefixes).toHaveLength(1);
    expect(collectedProperties[0].propertyModifier.parentPrefixes[0]).toBe('');
  });
});

describe('when one entity has a descriptor on an inline common reference which is role named', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';
  const resourceName = 'EntityName';
  const inlineCommonName = 'InlineCommonName';
  const inlineCommonRoleName = 'Role';
  const descriptorName = 'DescriptorName';

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartDomainEntity(resourceName)
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withInlineCommonProperty(inlineCommonName, 'doc', true, false, inlineCommonRoleName)
      .withEndDomainEntity()

      .withStartInlineCommon(inlineCommonName)
      .withDocumentation('doc')
      .withDescriptorProperty(descriptorName, 'doc', true, false)
      .withEndInlineCommon()

      .withStartDescriptor(descriptorName)
      .withDocumentation('doc')
      .withEndDescriptor()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    inlineCommonReferenceEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should have one descriptor collected property', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(resourceName);
    const collectedProperties = entity?.data.meadowlark.apiMapping.descriptorCollectedProperties;

    expect(collectedProperties).toHaveLength(1);
  });

  it('should have correct descriptor name', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get(resourceName);
    const collectedProperties = entity?.data.meadowlark.apiMapping.descriptorCollectedProperties;

    expect(collectedProperties[0].property.type).toBe('descriptor');
    expect(collectedProperties[0].property.metaEdName).toBe(descriptorName);
    expect(collectedProperties[0].property.isRequiredCollection).toBe(false);
    expect(collectedProperties[0].propertyModifier.optionalDueToParent).toBe(false);
    expect(collectedProperties[0].propertyModifier.parentPrefixes).toHaveLength(1);
    expect(collectedProperties[0].propertyModifier.parentPrefixes[0]).toBe(inlineCommonRoleName);
  });
});

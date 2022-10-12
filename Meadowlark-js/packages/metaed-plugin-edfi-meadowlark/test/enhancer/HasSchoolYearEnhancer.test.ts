// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  AssociationBuilder,
  AssociationSubclassBuilder,
  AssociationExtensionBuilder,
  CommonBuilder,
  DomainEntityBuilder,
  DomainEntitySubclassBuilder,
  EnhancerResult,
  MetaEdEnvironment,
  MetaEdTextBuilder,
  NamespaceBuilder,
  newMetaEdEnvironment,
} from '@edfi/metaed-core';
import {
  domainEntityReferenceEnhancer,
  domainEntitySubclassBaseClassEnhancer,
  domainBaseEntityEnhancer,
  domainEntityExtensionBaseClassEnhancer,
  associationReferenceEnhancer,
  associationSubclassBaseClassEnhancer,
  associationExtensionBaseClassEnhancer,
  commonReferenceEnhancer,
  commonSubclassBaseClassEnhancer,
  commonExtensionBaseClassEnhancer,
} from '@edfi/metaed-plugin-edfi-unified';
import { enhance as entityPropertyMeadowlarkDataSetupEnhancer } from '../../src/model/EntityPropertyMeadowlarkData';
import { enhance as entityMeadowlarkDataSetupEnhancer, EntityMeadowlarkData } from '../../src/model/EntityMeadowlarkData';
import { enhance as propertyCollectingEnhancer } from '../../src/enhancer/PropertyCollectingEnhancer';
import { enhance as subClassPropertyCollectingEnhancer } from '../../src/enhancer/SubclassPropertyCollectingEnhancer';
import { enhance } from '../../src/enhancer/HasSchoolYearEnhancer';

describe('when detecting presence of a school year', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';
  let enhancerResult: EnhancerResult;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)

      .withStartDomainEntity('DomainEntityWithSchoolYear')
      .withDocumentation('doc')
      .withStringIdentity('DomainEntityWithSchoolYearIdentifier', 'doc', '30')
      .withEnumerationProperty('SchoolYear', 'doc', false, false)
      .withEndDomainEntity()

      .withStartDomainEntity('DomainEntityWithoutSchoolYear')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
      .withDomainEntityIdentity('School', 'doc')
      .withEndDomainEntity()

      .withStartAssociation('AssociationWithSchoolYear')
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
      .withEnumerationProperty('SchoolYear', 'doc', false, false)
      .withAssociationDomainEntityProperty('DomainEntityWithSchoolYear', '', null)
      .withAssociationDomainEntityProperty('DomainEntityWithoutSchoolYear', '', null)
      .withEndAssociation()

      .withStartAssociation('AssociationWithoutSchoolYear')
      .withDocumentation('doc')
      .withStringIdentity('ClassPeriodName', 'doc', '30')
      .withEndAssociation()

      .withStartDomainEntitySubclass('DomainEntitySubclassWithSchoolYear', 'DomainEntityWithSchoolYear')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntitySubclass()

      .withStartDomainEntitySubclass('DomainEntitySubclassWithoutSchoolYear', 'DomainEntityWithoutSchoolYear')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntitySubclass()

      .withStartAssociationSubclass('AssociationSubclassWithSchoolYear', 'AssociationWithSchoolYear')
      .withDocumentation('doc')
      .withStringIdentity('hello', 'doc', '30')
      .withAssociationDomainEntityProperty('DomainEntityWithSchoolYear', '', null)
      .withAssociationDomainEntityProperty('DomainEntityWithoutSchoolYear', '', null)
      .withEndAssociationSubclass()

      .withStartAssociationSubclass('AssociationSubclassWithoutSchoolYear', 'AssociationWithoutSchoolYear')
      .withDocumentation('doc')
      .withStringIdentity('hello', 'doc', '30')
      .withEndAssociationSubclass()

      .withStartCommon('CommonWithSchoolYear')
      .withEnumerationProperty('SchoolYear', 'doc', false, false)
      .withEndCommon()

      .withStartCommon('CommonWithoutSchoolYear')
      .withStringProperty('world', 'doc', false, false, '30')
      .withEndCommon()

      .withEndNamespace()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []))
      .sendToListener(new AssociationBuilder(metaEd, []))
      .sendToListener(new AssociationSubclassBuilder(metaEd, []))
      .sendToListener(new AssociationExtensionBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    domainEntitySubclassBaseClassEnhancer(metaEd);
    domainBaseEntityEnhancer(metaEd);
    domainEntityExtensionBaseClassEnhancer(metaEd);

    associationReferenceEnhancer(metaEd);
    associationSubclassBaseClassEnhancer(metaEd);
    associationExtensionBaseClassEnhancer(metaEd);

    commonReferenceEnhancer(metaEd);
    commonSubclassBaseClassEnhancer(metaEd);
    commonExtensionBaseClassEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);

    propertyCollectingEnhancer(metaEd);
    subClassPropertyCollectingEnhancer(metaEd);

    enhancerResult = enhance(metaEd);
  });

  it('returns successful', () => {
    expect(enhancerResult.success).toBeTruthy();
  });

  it('sets hasSchoolYear to true for a domainEntity that does have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get('DomainEntityWithSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeTruthy();
  });

  it('sets hasSchoolYear to false for a domainEntity that does not have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntity.get('DomainEntityWithoutSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeFalsy();
  });

  it('sets hasSchoolYear to true for a domainEntity subclass that does have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntitySubclass.get('DomainEntitySubclassWithSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeTruthy();
  });

  it('sets hasSchoolYear to false for a domainEntity subclass that does not have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.domainEntitySubclass.get('DomainEntitySubclassWithoutSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeFalsy();
  });

  it('sets hasSchoolYear to true for an association that does have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.association.get('AssociationWithSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeTruthy();
  });

  it('sets hasSchoolYear to false for an association that does not have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.association.get('AssociationWithoutSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeFalsy();
  });

  it('sets hasSchoolYear to true for a association subclass that does have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.associationSubclass.get('AssociationSubclassWithSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeTruthy();
  });

  it('sets hasSchoolYear to false for a association subclass that does not have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.associationSubclass.get('AssociationSubclassWithoutSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeFalsy();
  });

  it('sets hasSchoolYear to true for a common that does have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.common.get('CommonWithSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeTruthy();
  });

  it('sets hasSchoolYear to false for a common that does not have a school year', () => {
    const entity = metaEd.namespace.get(namespace)?.entity.common.get('CommonWithoutSchoolYear');
    expect(entity).not.toBeUndefined();

    const meadowlarkEntity = entity?.data.meadowlark as EntityMeadowlarkData;
    expect(meadowlarkEntity.hasSchoolYear).toBeFalsy();
  });
});

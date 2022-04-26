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
  NoEntityProperty,
} from '@edfi/metaed-core';
import { domainEntitySubclassBaseClassEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import { enhance as entityPropertyMeadowlarkDataSetupEnhancer } from '../../src/model/EntityPropertyMeadowlarkData';
import { enhance as entityMeadowlarkDataSetupEnhancer } from '../../src/model/EntityMeadowlarkData';
import { enhance } from '../../src/enhancer/SubclassPropertyNamingCollisionEnhancer';

describe('when superclass and subclass have a naming collision issue', () => {
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

    domainEntitySubclassBaseClassEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should indicate subclass property has a conflict with superclass property', () => {
    const schoolEntity: any = metaEd.namespace.get(namespace)?.entity.domainEntitySubclass.get(school);
    const schoolCategoryProperty = schoolEntity.properties.find((p) => p.metaEdName === `${school}${category}`);

    const edOrgEntity: any = metaEd.namespace.get(namespace)?.entity.domainEntity.get(educationOrganization);
    const edOrgCategoryProperty = edOrgEntity.properties.find((p) => p.metaEdName === `${educationOrganization}${category}`);

    expect(schoolCategoryProperty.data.meadowlark.namingCollisionWithSuperclassProperty).toBe(edOrgCategoryProperty);
  });

  it('should indicate superclass property has a conflict with subclass property', () => {
    const schoolEntity: any = metaEd.namespace.get(namespace)?.entity.domainEntitySubclass.get(school);
    const schoolCategoryProperty = schoolEntity.properties.find((p) => p.metaEdName === `${school}${category}`);

    const edOrgEntity: any = metaEd.namespace.get(namespace)?.entity.domainEntity.get(educationOrganization);
    const edOrgCategoryProperty = edOrgEntity.properties.find((p) => p.metaEdName === `${educationOrganization}${category}`);

    expect(edOrgCategoryProperty.data.meadowlark.namingCollisionWithSubclassProperties).toHaveLength(1);
    expect(edOrgCategoryProperty.data.meadowlark.namingCollisionWithSubclassProperties[0]).toBe(schoolCategoryProperty);
  });
});

describe('when superclass and subclass have no naming collision issue due to different collection suffixes', () => {
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
      .withStringProperty(`${educationOrganization}Not${category}`, 'doc', true, true, '30')
      .withEndAbstractEntity()

      .withStartDomainEntitySubclass(school, educationOrganization)
      .withDocumentation('doc')
      .withStringProperty(`${school}${category}`, 'doc', true, true, '30')
      .withEndDomainEntitySubclass()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []));

    domainEntitySubclassBaseClassEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should indicate subclass property has no conflict', () => {
    const schoolEntity: any = metaEd.namespace.get(namespace)?.entity.domainEntitySubclass.get(school);
    const schoolCategoryProperty = schoolEntity.properties.find((p) => p.metaEdName === `${school}${category}`);

    expect(schoolCategoryProperty.data.meadowlark.namingCollisionWithSuperclassProperty).toBe(NoEntityProperty);
  });

  it('should indicate superclass property has no conflict', () => {
    const edOrgEntity: any = metaEd.namespace.get(namespace)?.entity.domainEntity.get(educationOrganization);
    const edOrgCategoryProperty = edOrgEntity.properties.find(
      (p) => p.metaEdName === `${educationOrganization}Not${category}`,
    );

    expect(edOrgCategoryProperty.data.meadowlark.namingCollisionWithSubclassProperties).toHaveLength(0);
  });
});

describe('when superclass and subclass have no naming collision issue due to one being a non-collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';
  const educationOrganization = 'EducationOrganization';
  const localEducationAgency = 'LocalEducationAgency';
  const category = 'Category';

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartAbstractEntity(educationOrganization)
      .withDocumentation('doc')
      .withIntegerIdentity('Identity', 'doc')
      .withStringProperty(`${educationOrganization}${category}`, 'doc', true, true, '30')
      .withEndAbstractEntity()

      .withStartDomainEntitySubclass(localEducationAgency, educationOrganization)
      .withDocumentation('doc')
      .withStringProperty(`${localEducationAgency}${category}`, 'doc', true, false, '30')
      .withEndDomainEntitySubclass()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []));

    domainEntitySubclassBaseClassEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should indicate subclass property has no conflict', () => {
    const leaEntity: any = metaEd.namespace.get(namespace)?.entity.domainEntitySubclass.get(localEducationAgency);
    const leaCategoryProperty = leaEntity.properties.find((p) => p.metaEdName === `${localEducationAgency}${category}`);
    expect(leaCategoryProperty.data.meadowlark.namingCollisionWithSuperclassProperty).toBe(NoEntityProperty);
  });

  it('should indicate superclass property has no conflict', () => {
    const edOrgEntity: any = metaEd.namespace.get(namespace)?.entity.domainEntity.get(educationOrganization);
    const edOrgCategoryProperty = edOrgEntity.properties.find((p) => p.metaEdName === `${educationOrganization}${category}`);

    expect(edOrgCategoryProperty.data.meadowlark.namingCollisionWithSubclassProperties).toHaveLength(0);
  });
});

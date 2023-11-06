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
  EnumerationBuilder,
} from '@edfi/metaed-core';
import { domainEntityReferenceEnhancer, enumerationReferenceEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import { extractDocumentIdentity } from '../../src/extraction/DocumentIdentityExtractor';
import { DocumentIdentity } from '../../src/model/DocumentIdentity';
import { ApiSchema } from '../../src/model/api-schema/ApiSchema';
import { ResourceSchema } from '../../src/model/api-schema/ResourceSchema';
import { apiSchemaFrom } from '../TestHelper';

describe('when extracting natural key from domain entity referencing another referencing another with identity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentIdentity = [];

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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentIdentity(resourceSchema, body);
  });

  it('should be correct', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "classPeriodName": "z",
        },
        {
          "localCourseCode": "abc",
        },
        {
          "schoolId": "23",
        },
        {
          "sectionIdentifier": "Bob",
        },
      ]
    `);
  });
});

describe('when extracting natural key from domain entity with school year in identity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentIdentity = [];

  const body = {
    sessionName: 's',
    schoolYearTypeReference: {
      schoolYear: 2022,
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('Session')
      .withDocumentation('doc')
      .withStringIdentity('SessionName', 'doc', '30')
      .withEnumerationIdentity('SchoolYear', 'doc')
      .withEndDomainEntity()

      .withStartEnumeration('SchoolYear')
      .withDocumentation('doc')
      .withEnumerationItem('2022')
      .withEndEnumeration()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new EnumerationBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    enumerationReferenceEnhancer(metaEd);

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sessions'];
    result = extractDocumentIdentity(resourceSchema, body);
  });

  it('should be correct', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "schoolYear": 2022,
        },
        {
          "sessionName": "s",
        },
      ]
    `);
  });
});

describe('when extracting natural key from domain entity with school year that has a role name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentIdentity = [];

  const body = {
    graduationSchoolYearTypeReference: {
      schoolYear: 2022,
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDomainEntity('GraduationPlan')
      .withDocumentation('doc')
      .withEnumerationIdentity('SchoolYear', 'doc', 'Graduation')
      .withEndDomainEntity()

      .withStartEnumeration('SchoolYear')
      .withDocumentation('doc')
      .withEnumerationItem('2022')
      .withEndEnumeration()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new EnumerationBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    enumerationReferenceEnhancer(metaEd);

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['graduationPlans'];
    result = extractDocumentIdentity(resourceSchema, body);
  });

  it('should be correct', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "schoolYear": 2022,
        },
      ]
    `);
  });
});

describe('when extracting document identity with two levels of identities', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentIdentity = [];

  const body = {
    classPeriodName: 'c1',
    sessionReference: {
      sessionName: 's1',
      schoolId: '23',
    },
    schoolReference: {
      schoolId: '23',
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')

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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['classPeriods'];
    result = extractDocumentIdentity(resourceSchema, body);
  });

  it('should have two references down to "schoolId"', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "classPeriodName": "c1",
        },
        {
          "schoolId": "23",
        },
        {
          "sessionName": "s1",
        },
      ]
    `);
  });
});

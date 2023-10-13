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
  DescriptorBuilder,
} from '@edfi/metaed-core';
import {
  descriptorReferenceEnhancer,
  domainEntityReferenceEnhancer,
  enumerationReferenceEnhancer,
} from '@edfi/metaed-plugin-edfi-unified';
import { extractDocumentReferences } from '../../src/extraction/DocumentReferenceExtractor';
import { DocumentReference } from '../../src/model/DocumentReference';
import { apiSchemaFrom } from '../TestHelper';
import { ApiSchema } from '../../src/model/api-schema/ApiSchema';
import { ResourceSchema } from '../../src/model/api-schema/ResourceSchema';

describe('when extracting document references from domain entity referencing one as identity and another as collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have references', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "documentKey": "localCourseCode",
              "documentValue": "abc",
            },
            {
              "documentKey": "schoolId",
              "documentValue": "23",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "CourseOffering",
        },
        {
          "documentIdentity": [
            {
              "documentKey": "classPeriodName",
              "documentValue": "z1",
            },
            {
              "documentKey": "schoolId",
              "documentValue": "24",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": [
            {
              "documentKey": "classPeriodName",
              "documentValue": "z2",
            },
            {
              "documentKey": "schoolId",
              "documentValue": "25",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
      ]
    `);
  });
});

describe('when extracting with optional reference in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have references', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "documentKey": "localCourseCode",
              "documentValue": "abc",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "CourseOffering",
        },
      ]
    `);
  });
});

describe('when extracting with optional reference not in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have no references', () => {
    expect(result).toMatchInlineSnapshot(`[]`);
  });
});

describe('when extracting with one optional reference in body and one not', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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
      .withDomainEntityProperty('Course', 'doc', false, false)
      .withEndDomainEntity()

      .withStartDomainEntity('CourseOffering')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
      .withBooleanProperty('AlsoNotImportant', 'doc', true, true)
      .withEndDomainEntity()

      .withStartDomainEntity('Course')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourse', 'doc', '30')
      .withBooleanProperty('AlsoNotImportant', 'doc', true, true)
      .withEndDomainEntity()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have no references', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "documentKey": "localCourseCode",
              "documentValue": "abc",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "CourseOffering",
        },
      ]
    `);
  });
});

describe('when extracting optional collection in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have references', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "documentKey": "classPeriodName",
              "documentValue": "z1",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": [
            {
              "documentKey": "classPeriodName",
              "documentValue": "z2",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
      ]
    `);
  });
});

describe('when extracting optional collection not in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have no references', () => {
    expect(result).toMatchInlineSnapshot(`[]`);
  });
});

describe('when extracting document references with two levels of identities on a collection reference', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentReference[] = [];

  const body = {
    sectionIdentifier: 'Bob',
    courseOfferingReference: {
      localCourseCode: 'abc',
      schoolId: '23',
    },
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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have two references down to "schoolId"', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "documentKey": "classPeriodName",
              "documentValue": "c1",
            },
            {
              "documentKey": "schoolId",
              "documentValue": "24",
            },
            {
              "documentKey": "sessionName",
              "documentValue": "s1",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": [
            {
              "documentKey": "classPeriodName",
              "documentValue": "c2",
            },
            {
              "documentKey": "schoolId",
              "documentValue": "25",
            },
            {
              "documentKey": "sessionName",
              "documentValue": "s2",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
      ]
    `);
  });
});

describe('when extracting document references with three levels of identities on a collection reference', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentReference[] = [];

  const body = {
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

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have ClassPeriod references down to "thirdLevelName"', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "documentKey": "classPeriodName",
              "documentValue": "c1",
            },
            {
              "documentKey": "schoolId",
              "documentValue": "24",
            },
            {
              "documentKey": "secondLevelName",
              "documentValue": "e1",
            },
            {
              "documentKey": "sessionName",
              "documentValue": "s1",
            },
            {
              "documentKey": "thirdLevelName",
              "documentValue": "t1",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": [
            {
              "documentKey": "classPeriodName",
              "documentValue": "c2",
            },
            {
              "documentKey": "schoolId",
              "documentValue": "25",
            },
            {
              "documentKey": "secondLevelName",
              "documentValue": "e2",
            },
            {
              "documentKey": "sessionName",
              "documentValue": "s2",
            },
            {
              "documentKey": "thirdLevelName",
              "documentValue": "t2",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
      ]
    `);
  });
});

describe('when extracting with school year reference in body', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentReference[] = [];

  const body = {
    localCourseCode: 'abc',
    sessionReference: {
      sessionName: 'def',
      schoolId: 123,
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

      .withStartDomainEntity('CourseOffering')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
      .withDomainEntityProperty('Session', 'doc', false, false)
      .withEndDomainEntity()

      .withStartEnumeration('SchoolYear')
      .withDocumentation('doc')
      .withEnumerationItem('2022')
      .withEndEnumeration()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new EnumerationBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    enumerationReferenceEnhancer(metaEd);

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['courseOfferings'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have references', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "documentKey": "schoolYear",
              "documentValue": 2022,
            },
            {
              "documentKey": "sessionName",
              "documentValue": "def",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "Session",
        },
      ]
    `);
  });
});

describe('when extracting with school year in a reference document', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentReference[] = [];

  const body = {
    studentReference: {
      studentUniqueId: 's0zf6d1123d3e',
    },
    schoolReference: {
      schoolId: 123,
    },
    entryDate: '2020-01-01',
    entryGradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#10',
    graduationPlanReference: {
      educationOrganizationId: 123,
      graduationPlanTypeDescriptor: 'uri://ed-fi.org/GraduationPlanTypeDescriptor#Minimum',
      graduationSchoolYear: 2024,
    },
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')

      .withStartDomainEntity('StudentSchoolAssociation')
      .withDocumentation('doc')
      .withDomainEntityIdentity('Student', 'doc')
      .withDomainEntityIdentity('School', 'doc')
      .withDateIdentity('EntryDate', 'doc')
      .withDescriptorIdentity('EntryGradeLevelDescriptor', 'doc')
      .withDomainEntityProperty('GraduationPlan', 'doc', false, false)
      .withEndDomainEntity()

      .withStartDomainEntity('EducationOrganization')
      .withDocumentation('doc')
      .withStringIdentity('EducationOrganizationId', 'doc', '30')
      .withEndDomainEntity()

      .withStartDomainEntity('School')
      .withDocumentation('doc')
      .withStringIdentity('SchoolId', 'doc', '30')
      .withEndDomainEntity()

      .withStartDomainEntity('Student')
      .withDocumentation('doc')
      .withStringIdentity('StudentUniqueId', 'doc', '60')
      .withEndDomainEntity()

      .withStartDomainEntity('GraduationPlan')
      .withDocumentation('doc')
      .withDescriptorIdentity('GraduationPlanType', 'doc')
      .withDomainEntityIdentity('EducationOrganization', 'doc')
      .withEnumerationIdentity('SchoolYear', 'doc', 'Graduation')
      .withEndDomainEntity()

      .withStartEnumeration('SchoolYear')
      .withDocumentation('doc')
      .withEndEnumeration()

      .withStartDescriptor('EntryGradeLevelDescriptor')
      .withDocumentation('doc')
      .withEndDescriptor()

      .withStartDescriptor('GraduationPlanType')
      .withDocumentation('doc')
      .withEndDescriptor()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []))
      .sendToListener(new EnumerationBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    enumerationReferenceEnhancer(metaEd);
    descriptorReferenceEnhancer(metaEd);

    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['studentSchoolAssociations'];
    result = extractDocumentReferences(resourceSchema, body);
  });

  it('should have references and schoolYear reference should respect the role name', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "documentKey": "studentUniqueId",
              "documentValue": "s0zf6d1123d3e",
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "Student",
        },
        {
          "documentIdentity": [
            {
              "documentKey": "schoolId",
              "documentValue": 123,
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "School",
        },
        {
          "documentIdentity": [
            {
              "documentKey": "educationOrganizationId",
              "documentValue": 123,
            },
            {
              "documentKey": "graduationPlanTypeDescriptor",
              "documentValue": "uri://ed-fi.org/GraduationPlanTypeDescriptor#Minimum",
            },
            {
              "documentKey": "graduationSchoolYear",
              "documentValue": 2024,
            },
          ],
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "GraduationPlan",
        },
      ]
    `);
  });
});

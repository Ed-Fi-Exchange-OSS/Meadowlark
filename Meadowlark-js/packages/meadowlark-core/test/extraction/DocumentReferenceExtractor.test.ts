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
  EnumerationBuilder,
} from '@edfi/metaed-core';
import { domainEntityReferenceEnhancer, enumerationReferenceEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import {
  entityPropertyMeadowlarkDataSetupEnhancer,
  apiEntityMappingEnhancer,
  entityMeadowlarkDataSetupEnhancer,
  referenceComponentEnhancer,
  apiPropertyMappingEnhancer,
  propertyCollectingEnhancer,
} from '@edfi/metaed-plugin-edfi-meadowlark';
import { extractDocumentReferences } from '../../src/extraction/DocumentReferenceExtractor';
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
      [
        {
          "documentIdentity": {
            "classPeriodName": "z1",
            "schoolReference.schoolId": "24",
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": {
            "classPeriodName": "z2",
            "schoolReference.schoolId": "25",
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": {
            "localCourseCode": "abc",
            "schoolReference.schoolId": "23",
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "CourseOffering",
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
      [
        {
          "documentIdentity": {
            "localCourseCode": "abc",
          },
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
    expect(result).toMatchInlineSnapshot(`[]`);
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
      [
        {
          "documentIdentity": {
            "classPeriodName": "z1",
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": {
            "classPeriodName": "z2",
          },
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
    expect(result).toMatchInlineSnapshot(`[]`);
  });
});

describe('when extracting document references with two levels of identities on a collection reference', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
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

  it('should have two references down to "schoolId"', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": {
            "classPeriodName": "c1",
            "schoolReference.schoolId": "24",
            "sessionReference.schoolId": "24",
            "sessionReference.sessionName": "s1",
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": {
            "classPeriodName": "c2",
            "schoolReference.schoolId": "25",
            "sessionReference.schoolId": "25",
            "sessionReference.sessionName": "s2",
          },
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
  let namespace: any = null;
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

  it('should have ClassPeriod references down to "thirdLevelName"', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": {
            "classPeriodName": "c1",
            "schoolReference.schoolId": "24",
            "sessionReference.secondLevelName": "e1",
            "sessionReference.sessionName": "s1",
            "sessionReference.thirdLevelName": "t1",
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "ClassPeriod",
        },
        {
          "documentIdentity": {
            "classPeriodName": "c2",
            "schoolReference.schoolId": "25",
            "sessionReference.secondLevelName": "e2",
            "sessionReference.sessionName": "s2",
            "sessionReference.thirdLevelName": "t2",
          },
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
  let namespace: any = null;
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
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const courseOffering = namespace.entity.domainEntity.get('CourseOffering');
    result = extractDocumentReferences(courseOffering, body);
  });

  it('should have references', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": {
            "schoolYearTypeReference.schoolYear": 2022,
            "sessionName": "def",
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "Session",
        },
      ]
    `);
  });
});

describe('when extracting with a school year in a reference document', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let namespace: any = null;
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

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new EnumerationBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    domainEntityReferenceEnhancer(metaEd);
    enumerationReferenceEnhancer(metaEd);
    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);

    namespace = metaEd.namespace.get('EdFi');
    const studentSchoolAssociation = namespace.entity.domainEntity.get('StudentSchoolAssociation');
    result = extractDocumentReferences(studentSchoolAssociation, body);
  });

  it('should have references and schoolYear reference should respect the role name', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": {
            "graduationPlanTypeDescriptor": "uri://ed-fi.org/GraduationPlanTypeDescriptor#Minimum",
            "graduationSchoolYearTypeReference.schoolYear": 2024,
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "GraduationPlan",
        },
        {
          "documentIdentity": {
            "schoolId": 123,
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "School",
        },
        {
          "documentIdentity": {
            "studentUniqueId": "s0zf6d1123d3e",
          },
          "isDescriptor": false,
          "projectName": "EdFi",
          "resourceName": "Student",
        },
      ]
    `);
  });
});

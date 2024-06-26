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
} from '@edfi/metaed-core';
import { domainEntityReferenceEnhancer } from '@edfi/metaed-plugin-edfi-unified';
import { validateEqualityConstraints } from '../../src/validation/EqualityConstraintValidator';
import { ResourceSchema } from '../../src/model/api-schema/ResourceSchema';
import { ApiSchema } from '../../src/model/api-schema/ApiSchema';
import { apiSchemaFrom } from '../TestHelper';

/**
 * A ResourceSchema for a Section with a merge on School between CourseOffering and ClassPeriod.
 *
 */
function sectionResourceSchema(): ResourceSchema {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();

  MetaEdTextBuilder.build()
    .withBeginNamespace('EdFi')
    .withStartDomainEntity('Section')
    .withDocumentation('doc')
    .withStringIdentity('SectionIdentifier', 'doc', '30')
    .withDomainEntityIdentity('CourseOffering', 'doc')
    .withDomainEntityProperty('ClassPeriod', 'doc', true, true)

    // This merge on School is what is being used for testing. School is defined as a reference on both
    // CourseOffering and ClassPeriod. Because SchoolId is defined as the sole identity field for a School,
    // School will manifest in the Section API document as schoolId fields on both the courseOfferingReference
    // (required in the Section document because it is defined as part of Section's identity) and any of
    // the optional array of classPeriodReferences.
    //
    // Thus, the merge creates a requirement of equality between the required document field
    // courseOfferingReference.schoolId and any classPeriodReference.schoolId fields in the optional
    // array of classPeriods in the document.
    //
    .withMergeDirective('ClassPeriod.School', 'CourseOffering.School')
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

  const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
  return apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];
}

describe('when CourseOffering schoolId is a mismatch with a single ClassPeriod', () => {
  let validationResult: string[] = [];
  const sectionBody = {
    sectionIdentifier: 'sectionIdentifier',
    courseOfferingReference: {
      localCourseCode: 'localCourseCode',
      schoolId: 6,
      sessionName: 'sessionName',
      schoolYear: 2020,
    },
    classPeriods: [
      {
        classPeriodReference: {
          schoolId: 6666,
          classPeriodName: 'classPeriodName1',
        },
      },
    ],
  };

  beforeAll(() => {
    validationResult = validateEqualityConstraints(sectionResourceSchema(), sectionBody);
  });

  it('should have a validation failure', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      [
        "Constraint failure: document paths $.classPeriods[*].classPeriodReference.schoolId and $.courseOfferingReference.schoolId must have the same values",
      ]
    `);
  });
});

describe('when CourseOffering schoolId is a mismatch with two ClassPeriods', () => {
  let validationResult: string[] = [];
  const sectionBody = {
    sectionIdentifier: 'sectionIdentifier',
    courseOfferingReference: {
      localCourseCode: 'localCourseCode',
      schoolId: 6,
      sessionName: 'sessionName',
      schoolYear: 2020,
    },
    classPeriods: [
      {
        classPeriodReference: {
          schoolId: 6666,
          classPeriodName: 'classPeriodName1',
        },
      },
      {
        classPeriodReference: {
          schoolId: 6666,
          classPeriodName: 'classPeriodName2',
        },
      },
    ],
  };

  beforeAll(() => {
    validationResult = validateEqualityConstraints(sectionResourceSchema(), sectionBody);
  });

  it('should have a validation failure', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      [
        "Constraint failure: document paths $.classPeriods[*].classPeriodReference.schoolId and $.courseOfferingReference.schoolId must have the same values",
      ]
    `);
  });
});

describe('when CourseOffering schoolId is a mismatch with one ClassPeriod but a match with another', () => {
  let validationResult: string[] = [];
  const sectionBody = {
    sectionIdentifier: 'sectionIdentifier',
    courseOfferingReference: {
      localCourseCode: 'localCourseCode',
      schoolId: 6,
      sessionName: 'sessionName',
      schoolYear: 2020,
    },
    classPeriods: [
      {
        classPeriodReference: {
          schoolId: 6,
          classPeriodName: 'classPeriodName1',
        },
      },
      {
        classPeriodReference: {
          schoolId: 6666,
          classPeriodName: 'classPeriodName2',
        },
      },
    ],
  };

  beforeAll(() => {
    validationResult = validateEqualityConstraints(sectionResourceSchema(), sectionBody);
  });

  it('should have a validation failure', () => {
    expect(validationResult).toMatchInlineSnapshot(`
      [
        "Constraint failure: document paths $.classPeriods[*].classPeriodReference.schoolId and $.courseOfferingReference.schoolId must have the same values",
      ]
    `);
  });
});

describe('when ClassPeriods are not present', () => {
  let validationResult: string[] = [];
  const sectionBody = {
    sectionIdentifier: 'sectionIdentifier',
    courseOfferingReference: {
      localCourseCode: 'localCourseCode',
      schoolId: 6,
      sessionName: 'sessionName',
      schoolYear: 2020,
    },
  };

  beforeAll(() => {
    validationResult = validateEqualityConstraints(sectionResourceSchema(), sectionBody);
  });

  it('should have no validation failure', () => {
    expect(validationResult).toHaveLength(0);
  });
});

describe('when CourseOffering schoolId is a match with all ClassPeriods', () => {
  let validationResult: string[] = [];
  const sectionBody = {
    sectionIdentifier: 'sectionIdentifier',
    courseOfferingReference: {
      localCourseCode: 'localCourseCode',
      schoolId: 6,
      sessionName: 'sessionName',
      schoolYear: 2020,
    },
    classPeriods: [
      {
        classPeriodReference: {
          schoolId: 6,
          classPeriodName: 'classPeriodName1',
        },
      },
      {
        classPeriodReference: {
          schoolId: 6,
          classPeriodName: 'classPeriodName2',
        },
      },
    ],
  };

  beforeAll(() => {
    validationResult = validateEqualityConstraints(sectionResourceSchema(), sectionBody);
  });

  it('should have no validation failure', () => {
    expect(validationResult).toHaveLength(0);
  });
});

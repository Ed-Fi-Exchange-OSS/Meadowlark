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
  DescriptorBuilder,
  DomainEntitySubclassBuilder,
  CommonBuilder,
} from '@edfi/metaed-core';
import {
  inlineCommonReferenceEnhancer,
  descriptorReferenceEnhancer,
  domainEntitySubclassBaseClassEnhancer,
} from '@edfi/metaed-plugin-edfi-unified';

import { extractDescriptorValues } from '../../src/extraction/DescriptorValueExtractor';
import { DocumentReference } from '../../src/model/DocumentReference';
import { apiSchemaFrom } from '../TestHelper';
import { ApiSchema } from '../../src/model/api-schema/ApiSchema';
import { ResourceSchema } from '../../src/model/api-schema/ResourceSchema';

describe('when extracting single descriptor value from domain entity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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
    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['entityNames'];

    result = extractDescriptorValues(resourceSchema, body);
  });

  it('should have the descriptor value for a GradingPeriod', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "descriptor": "uri://ed-fi.org/grade",
            },
          ],
          "isDescriptor": true,
          "projectName": "EdFi",
          "resourceName": "GradingPeriodDescriptor",
        },
      ]
    `);
  });
});

describe('when extracting single descriptor value from common with role name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  let result: DocumentReference[] = [];

  const descriptorValue = 'uri://ed-fi.org/grade';

  const body = {
    SectionIdentifier: 123,
    availableCreditTypeDescriptor: descriptorValue,
  };

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace('EdFi')
      .withStartDescriptor('CreditType')
      .withDocumentation('Documentation')
      .withEndDescriptor()

      .withStartInlineCommon('Credits')
      .withDocumentation('Documentation')
      .withDescriptorProperty('CreditType', 'Documentation', false, false)
      .withEndInlineCommon()

      .withStartDomainEntity('Section')
      .withDocumentation('Documentation')
      .withIntegerIdentity('SectionIdentifier', 'Documentation')
      .withInlineCommonProperty('Credits', 'Documentation', false, false, 'Available')
      .withEndDomainEntity()
      .withEndNamespace()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));

    inlineCommonReferenceEnhancer(metaEd);
    descriptorReferenceEnhancer(metaEd);
    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['sections'];

    result = extractDescriptorValues(resourceSchema, body);
  });

  it('should have the descriptor value', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "descriptor": "uri://ed-fi.org/grade",
            },
          ],
          "isDescriptor": true,
          "projectName": "EdFi",
          "resourceName": "CreditTypeDescriptor",
        },
      ]
    `);
  });
});

describe('when extracting descriptor values from domain entity with the same names', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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
    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['gradingPeriods'];

    result = extractDescriptorValues(resourceSchema, body);
  });

  it('should have the descriptor value for a GradingPeriod', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "descriptor": "uri://ed-fi.org/grade",
            },
          ],
          "isDescriptor": true,
          "projectName": "EdFi",
          "resourceName": "GradingPeriodDescriptor",
        },
      ]
    `);
  });
});

describe('when extracting array of descriptor values from domain entity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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
    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['entityNames'];

    result = extractDescriptorValues(resourceSchema, body);
  });

  it('should have the descriptor values for the GradingPeriods', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "descriptor": "uri://ed-fi.org/grade1",
            },
            {
              "descriptor": "uri://ed-fi.org/grade2",
            },
            {
              "descriptor": "uri://ed-fi.org/grade3",
            },
          ],
          "isDescriptor": true,
          "projectName": "EdFi",
          "resourceName": "GradingPeriodDescriptor",
        },
      ]
    `);
  });
});

describe('when extracting collection from domain entity subclass with naming collision issue', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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
      .withIdentityRenameProperty('integer', 'SchoolId', 'Identity', 'doc')
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
    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['schools'];

    result = extractDescriptorValues(resourceSchema, body);
  });

  it('should have values for body without collection prefix removal', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "descriptor": "uri://ed-fi.org/schoolValue",
            },
          ],
          "isDescriptor": true,
          "projectName": "EdFi",
          "resourceName": "SchoolCategoryDescriptor",
        },
        {
          "documentIdentity": [
            {
              "descriptor": "uri://ed-fi.org/edOrgValue",
            },
          ],
          "isDescriptor": true,
          "projectName": "EdFi",
          "resourceName": "EducationOrganizationCategoryDescriptor",
        },
      ]
    `);
  });
});

describe('when extracting collection from domain entity subclass with no naming collision issue due to one being a non-collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
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
      .withIdentityRenameProperty('integer', 'SchoolId', 'Identity', 'doc')
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
    const apiSchema: ApiSchema = apiSchemaFrom(metaEd);
    const resourceSchema: ResourceSchema = apiSchema.projectSchemas['edfi'].resourceSchemas['schools'];

    result = extractDescriptorValues(resourceSchema, body);
  });

  it('should have values for body with collection prefix removal and without collection', () => {
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "documentIdentity": [
            {
              "descriptor": "uri://ed-fi.org/schoolValue",
            },
          ],
          "isDescriptor": true,
          "projectName": "EdFi",
          "resourceName": "SchoolCategoryDescriptor",
        },
        {
          "documentIdentity": [
            {
              "descriptor": "uri://ed-fi.org/edOrgValue",
            },
          ],
          "isDescriptor": true,
          "projectName": "EdFi",
          "resourceName": "EducationOrganizationCategoryDescriptor",
        },
      ]
    `);
  });
});

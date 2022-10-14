// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Ajv from 'ajv/dist/2020';
import addFormatsTo from 'ajv-formats';
import {
  newMetaEdEnvironment,
  MetaEdEnvironment,
  DomainEntityBuilder,
  ChoiceBuilder,
  CommonBuilder,
  MetaEdTextBuilder,
  NamespaceBuilder,
  DomainEntitySubclassBuilder,
  DescriptorBuilder,
  EnumerationBuilder,
} from '@edfi/metaed-core';
import {
  domainEntityReferenceEnhancer,
  choiceReferenceEnhancer,
  inlineCommonReferenceEnhancer,
  commonReferenceEnhancer,
  descriptorReferenceEnhancer,
  domainEntitySubclassBaseClassEnhancer,
  enumerationReferenceEnhancer,
} from '@edfi/metaed-plugin-edfi-unified';
import { enhance as entityPropertyMeadowlarkDataSetupEnhancer } from '../../src/model/EntityPropertyMeadowlarkData';
import { enhance as entityMeadowlarkDataSetupEnhancer } from '../../src/model/EntityMeadowlarkData';
import { enhance as subclassPropertyNamingCollisionEnhancer } from '../../src/enhancer/SubclassPropertyNamingCollisionEnhancer';
import { enhance as referenceComponentEnhancer } from '../../src/enhancer/ReferenceComponentEnhancer';
import { enhance as apiPropertyMappingEnhancer } from '../../src/enhancer/ApiPropertyMappingEnhancer';
import { enhance as apiEntityMappingEnhancer } from '../../src/enhancer/ApiEntityMappingEnhancer';
import { enhance as subclassApiEntityMappingEnhancer } from '../../src/enhancer/SubclassApiEntityMappingEnhancer';
import { enhance as propertyCollectingEnhancer } from '../../src/enhancer/PropertyCollectingEnhancer';
import { enhance as subclassPropertyCollectingEnhancer } from '../../src/enhancer/SubclassPropertyCollectingEnhancer';
import { enhance } from '../../src/enhancer/JsonSchemaEnhancer';

const ajv = new Ajv({ allErrors: true });
addFormatsTo(ajv);

describe('when building simple domain entity with all the simple non-collections', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  const domainEntityName = 'DomainEntityName';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity(domainEntityName)
      .withDocumentation('doc')
      .withBooleanProperty('OptionalBooleanProperty', 'doc1', false, false)
      .withCurrencyProperty('RequiredCurrencyProperty', 'doc2', true, false)
      .withDecimalProperty('OptionalDecimalProperty', 'doc3', false, false, '2', '1')
      .withDurationProperty('RequiredDurationProperty', 'doc4', true, false)
      .withPercentProperty('OptionalPercentProperty', 'doc5', false, false)
      .withDateProperty('RequiredDateProperty', 'doc6', true, false)
      .withDatetimeProperty('RequiredDatetimeProperty', 'doc7', true, false)
      .withIntegerProperty('RequiredIntegerProperty', 'doc8', true, false, '10', '5')
      .withShortProperty('OptionalShortProperty', 'doc9', false, false)
      .withStringIdentity('StringIdentity', 'doc10', '30', '20')
      .withTimeProperty('RequiredTimeProperty', 'doc11', true, false)
      .withEnumerationProperty('SchoolYear', 'doc12', false, false)
      .withYearProperty('OptionalYear', 'doc13', false, false)
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
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "optionalBooleanProperty": {
            "description": "doc1",
            "type": "boolean",
          },
          "optionalDecimalProperty": {
            "description": "doc3",
            "type": "number",
          },
          "optionalPercentProperty": {
            "description": "doc5",
            "type": "number",
          },
          "optionalShortProperty": {
            "description": "doc9",
            "type": "integer",
          },
          "optionalYear": {
            "description": "doc13",
            "type": "integer",
          },
          "requiredCurrencyProperty": {
            "description": "doc2",
            "type": "number",
          },
          "requiredDateProperty": {
            "description": "doc6",
            "format": "date",
            "type": "string",
          },
          "requiredDatetimeProperty": {
            "description": "doc7",
            "format": "date-time",
            "type": "string",
          },
          "requiredDurationProperty": {
            "description": "doc4",
            "type": "number",
          },
          "requiredIntegerProperty": {
            "description": "doc8",
            "maximum": 10,
            "minimum": 5,
            "type": "integer",
          },
          "requiredTimeProperty": {
            "description": "doc11",
            "format": "time",
            "type": "string",
          },
          "schoolYearTypeReference": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "additionalProperties": false,
            "description": "A school year enumeration",
            "properties": {
              "schoolYear": {
                "description": "A school year between 1900 and 2100",
                "maximum": 2100,
                "minimum": 1900,
                "type": "number",
              },
            },
            "title": "EdFi.SchoolYearType",
            "type": "object",
          },
          "stringIdentity": {
            "description": "doc10",
            "maxLength": 30,
            "minLength": 20,
            "type": "string",
          },
        },
        "required": [
          "requiredCurrencyProperty",
          "requiredDurationProperty",
          "requiredDateProperty",
          "requiredDatetimeProperty",
          "requiredIntegerProperty",
          "stringIdentity",
          "requiredTimeProperty",
        ],
        "title": "EdFi.DomainEntityName",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building simple domain entity with all the simple collections', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  const domainEntityName = 'DomainEntityName';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity(domainEntityName)
      .withDocumentation('doc')
      .withBooleanProperty('OptionalBooleanProperty', 'doc1', false, true)
      .withCurrencyProperty('RequiredCurrencyProperty', 'doc2', true, true)
      .withDecimalProperty('OptionalDecimalProperty', 'doc3', false, true, '2', '1')
      .withDurationProperty('RequiredDurationProperty', 'doc4', true, true)
      .withPercentProperty('OptionalPercentProperty', 'doc5', false, true)
      .withDateProperty('RequiredDateProperty', 'doc6', true, true)
      .withDatetimeProperty('RequiredDatetimeProperty', 'doc7', true, true)
      .withIntegerProperty('RequiredIntegerProperty', 'doc8', true, true, '10', '5')
      .withShortProperty('OptionalShortProperty', 'doc9', false, true)
      .withStringIdentity('StringIdentity', 'doc10', '30', '20')
      .withStringProperty('RequiredStringProperty', 'doc11', true, true, '31', '21')
      .withTimeProperty('RequiredTimeProperty', 'doc12', true, true)
      .withEnumerationProperty('SchoolYear', 'doc13', false, true)
      .withYearProperty('OptionalYear', 'doc14', false, true)
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
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "optionalBooleanProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "optionalBooleanProperty": {
                  "description": "doc1",
                  "type": "boolean",
                },
              },
              "required": [
                "optionalBooleanProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "optionalDecimalProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "optionalDecimalProperty": {
                  "description": "doc3",
                  "type": "number",
                },
              },
              "required": [
                "optionalDecimalProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "optionalPercentProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "optionalPercentProperty": {
                  "description": "doc5",
                  "type": "number",
                },
              },
              "required": [
                "optionalPercentProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "optionalShortProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "optionalShortProperty": {
                  "description": "doc9",
                  "type": "integer",
                },
              },
              "required": [
                "optionalShortProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "optionalYears": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "optionalYear": {
                  "description": "doc14",
                  "type": "integer",
                },
              },
              "required": [
                "optionalYear",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "requiredCurrencyProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "requiredCurrencyProperty": {
                  "description": "doc2",
                  "type": "number",
                },
              },
              "required": [
                "requiredCurrencyProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "requiredDateProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "requiredDateProperty": {
                  "description": "doc6",
                  "format": "date",
                  "type": "string",
                },
              },
              "required": [
                "requiredDateProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "requiredDatetimeProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "requiredDatetimeProperty": {
                  "description": "doc7",
                  "format": "date-time",
                  "type": "string",
                },
              },
              "required": [
                "requiredDatetimeProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "requiredDurationProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "requiredDurationProperty": {
                  "description": "doc4",
                  "type": "number",
                },
              },
              "required": [
                "requiredDurationProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "requiredIntegerProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "requiredIntegerProperty": {
                  "description": "doc8",
                  "maximum": 10,
                  "minimum": 5,
                  "type": "integer",
                },
              },
              "required": [
                "requiredIntegerProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "requiredStringProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "requiredStringProperty": {
                  "description": "doc11",
                  "maxLength": 31,
                  "minLength": 21,
                  "type": "string",
                },
              },
              "required": [
                "requiredStringProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "requiredTimeProperties": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "requiredTimeProperty": {
                  "description": "doc12",
                  "format": "time",
                  "type": "string",
                },
              },
              "required": [
                "requiredTimeProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "schoolYearTypeReference": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "additionalProperties": false,
            "description": "A school year enumeration",
            "properties": {
              "schoolYear": {
                "description": "A school year between 1900 and 2100",
                "maximum": 2100,
                "minimum": 1900,
                "type": "number",
              },
            },
            "title": "EdFi.SchoolYearType",
            "type": "object",
          },
          "stringIdentity": {
            "description": "doc10",
            "maxLength": 30,
            "minLength": 20,
            "type": "string",
          },
        },
        "required": [
          "requiredCurrencyProperties",
          "requiredDurationProperties",
          "requiredDateProperties",
          "requiredDatetimeProperties",
          "requiredIntegerProperties",
          "stringIdentity",
          "requiredStringProperties",
          "requiredTimeProperties",
        ],
        "title": "EdFi.DomainEntityName",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building a domain entity referencing another referencing another with identity', () => {
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
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "classPeriods": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "classPeriodReference": {
                  "additionalProperties": false,
                  "properties": {
                    "classPeriodName": {
                      "description": "doc",
                      "maxLength": 30,
                      "type": "string",
                    },
                    "schoolId": {
                      "description": "doc",
                      "maxLength": 30,
                      "type": "string",
                    },
                  },
                  "required": [
                    "classPeriodName",
                    "schoolId",
                  ],
                  "type": "object",
                },
              },
              "required": [
                "classPeriodReference",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "courseOfferingReference": {
            "additionalProperties": false,
            "properties": {
              "localCourseCode": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
              "schoolId": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "required": [
              "localCourseCode",
              "schoolId",
            ],
            "type": "object",
          },
          "sectionIdentifier": {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
        },
        "required": [
          "sectionIdentifier",
          "courseOfferingReference",
          "classPeriods",
        ],
        "title": "EdFi.DomainEntityName",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building a domain entity referencing CourseOffering with an implicit merge between School and Session.School', () => {
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
      .withEndDomainEntity()

      .withStartDomainEntity('CourseOffering')
      .withDocumentation('doc')
      .withStringIdentity('LocalCourseCode', 'doc', '30')
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
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "courseOfferingReference": {
            "additionalProperties": false,
            "properties": {
              "localCourseCode": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
              "schoolId": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
              "sessionName": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "required": [
              "localCourseCode",
              "schoolId",
              "sessionName",
            ],
            "type": "object",
          },
          "sectionIdentifier": {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
        },
        "required": [
          "sectionIdentifier",
          "courseOfferingReference",
        ],
        "title": "EdFi.DomainEntityName",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    ajv.compile(entity.data.meadowlark.jsonSchema);
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
      .withStringProperty('RequiredURI', 'doc', true, true, '30')
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
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "contentIdentifier": {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "derivativeSourceEducationContents": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "derivativeSourceEducationContentReference": {
                  "additionalProperties": false,
                  "properties": {
                    "contentIdentifier": {
                      "description": "doc",
                      "maxLength": 30,
                      "type": "string",
                    },
                  },
                  "type": "object",
                },
              },
              "required": [
                "derivativeSourceEducationContentReference",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "derivativeSourceURIs": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "derivativeSourceURI": {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": [
                "derivativeSourceURI",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "description": {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "learningResourceMetadataURI": {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "requiredURIs": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "requiredURI": {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": [
                "requiredURI",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
        },
        "required": [
          "contentIdentifier",
          "learningResourceMetadataURI",
          "requiredURIs",
        ],
        "title": "EdFi.EducationContent",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with scalar collection named with prefix of parent entity', () => {
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
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "contentIdentifier": {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "suffixNames": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "suffixName": {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": [
                "suffixName",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
        },
        "required": [
          "contentIdentifier",
          "suffixNames",
        ],
        "title": "EdFi.EducationContent",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    ajv.compile(entity.data.meadowlark.jsonSchema);
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
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "contentIdentifier": {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "educationContentSuffixNames": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "educationContentSuffixNameReference": {
                  "additionalProperties": false,
                  "properties": {
                    "stringIdentity": {
                      "description": "doc",
                      "maxLength": 30,
                      "type": "string",
                    },
                  },
                  "required": [
                    "stringIdentity",
                  ],
                  "type": "object",
                },
              },
              "required": [
                "educationContentSuffixNameReference",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
        },
        "required": [
          "contentIdentifier",
          "educationContentSuffixNames",
        ],
        "title": "EdFi.EducationContent",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get(domainEntityName);
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with a simple common collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('Assessment')
      .withDocumentation('doc')
      .withIntegerIdentity('AssessmentIdentifier', 'doc')
      .withCommonProperty('AssessmentIdentificationCode', 'doc', false, true)
      .withEndDomainEntity()

      .withStartCommon('AssessmentIdentificationCode')
      .withDocumentation('doc')
      .withStringProperty('IdentificationCode', 'doc', true, false, '30')
      .withDescriptorIdentity('AssessmentIdentificationSystem', 'doc')
      .withEndCommon()

      .withStartDescriptor('AssessmentIdentificationSystem')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    commonReferenceEnhancer(metaEd);
    descriptorReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "assessmentIdentifier": {
            "description": "doc",
            "type": "integer",
          },
          "identificationCodes": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "assessmentIdentificationSystemDescriptor": {
                  "description": "doc",
                  "type": "string",
                },
                "identificationCode": {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": [
                "identificationCode",
                "assessmentIdentificationSystemDescriptor",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
        },
        "required": [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity subclass with common collection and descriptor identity in superclass', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  const domainEntitySubclassName = 'CommunityOrganization';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartAbstractEntity('EducationOrganization')
      .withDocumentation('doc')
      .withIntegerIdentity('EducationOrganizationId', 'doc')
      .withCommonProperty('EducationOrganizationIdentificationCode', 'doc', false, true)
      .withEndAbstractEntity()

      .withStartDomainEntitySubclass(domainEntitySubclassName, 'EducationOrganization')
      .withDocumentation('doc')
      .withIntegerIdentityRename('CommunityOrganizationId', 'EducationOrganizationId', 'doc')
      .withEndDomainEntitySubclass()

      .withStartCommon('EducationOrganizationIdentificationCode')
      .withDocumentation('doc')
      .withStringProperty('IdentificationCode', 'doc', true, false, '30')
      .withDescriptorIdentity('EducationOrganizationIdentificationSystem', 'doc')
      .withEndCommon()

      .withStartDescriptor('EducationOrganizationIdentificationSystem')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    domainEntitySubclassBaseClassEnhancer(metaEd);
    commonReferenceEnhancer(metaEd);
    descriptorReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    subclassPropertyNamingCollisionEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    subclassPropertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    subclassApiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntitySubclass.get(domainEntitySubclassName);
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "communityOrganizationId": {
            "description": "doc",
            "type": "integer",
          },
          "identificationCodes": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "educationOrganizationIdentificationSystemDescriptor": {
                  "description": "doc",
                  "type": "string",
                },
                "identificationCode": {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": [
                "identificationCode",
                "educationOrganizationIdentificationSystemDescriptor",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
        },
        "required": [
          "communityOrganizationId",
        ],
        "title": "EdFi.CommunityOrganization",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntitySubclass.get(domainEntitySubclassName);
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building association with a common collection in a common collection', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('StudentEducationOrganizationAssociation')
      .withDocumentation('doc')
      .withIntegerIdentity('Student', 'doc')
      .withCommonProperty('Address', 'doc', false, true)
      .withEndDomainEntity()

      .withStartCommon('Address')
      .withDocumentation('doc')
      .withStringProperty('StreetNumberName', 'doc', true, false, '30')
      .withCommonProperty('Period', 'doc', false, true)
      .withEndCommon()

      .withStartCommon('Period')
      .withDocumentation('doc')
      .withIntegerIdentity('BeginDate', 'doc')
      .withIntegerProperty('EndDate', 'doc', false, false)
      .withEndCommon()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    commonReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('StudentEducationOrganizationAssociation');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "addresses": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "periods": {
                  "items": {
                    "additionalProperties": false,
                    "properties": {
                      "beginDate": {
                        "description": "doc",
                        "type": "integer",
                      },
                      "endDate": {
                        "description": "doc",
                        "type": "integer",
                      },
                    },
                    "required": [
                      "beginDate",
                    ],
                    "type": "object",
                  },
                  "minItems": 1,
                  "type": "array",
                  "uniqueItems": false,
                },
                "streetNumberName": {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": [
                "streetNumberName",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "student": {
            "description": "doc",
            "type": "integer",
          },
        },
        "required": [
          "student",
        ],
        "title": "EdFi.StudentEducationOrganizationAssociation",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('StudentEducationOrganizationAssociation');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with a descriptor with role name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('Assessment')
      .withDocumentation('doc')
      .withIntegerIdentity('AssessmentIdentifier', 'doc')
      .withDescriptorProperty('GradeLevel', 'doc', false, false, 'Assessed')
      .withEndDomainEntity()

      .withStartDescriptor('GradeLevel')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    descriptorReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "assessedGradeLevelDescriptor": {
            "description": "doc",
            "type": "string",
          },
          "assessmentIdentifier": {
            "description": "doc",
            "type": "integer",
          },
        },
        "required": [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with a descriptor collection with role name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('Assessment')
      .withDocumentation('doc')
      .withIntegerIdentity('AssessmentIdentifier', 'doc')
      .withDescriptorProperty('GradeLevel', 'doc', false, true, 'Assessed')
      .withEndDomainEntity()

      .withStartDescriptor('GradeLevel')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    descriptorReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "assessedGradeLevels": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "gradeLevelDescriptor": {
                  "description": "An Ed-Fi Descriptor",
                  "type": "string",
                },
              },
              "required": [
                "gradeLevelDescriptor",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
          "assessmentIdentifier": {
            "description": "doc",
            "type": "integer",
          },
        },
        "required": [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with a common with a choice', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('Assessment')
      .withDocumentation('doc')
      .withIntegerIdentity('AssessmentIdentifier', 'doc')
      .withCommonProperty('ContentStandard', 'doc', false, false)
      .withEndDomainEntity()

      .withStartCommon('ContentStandard')
      .withDocumentation('doc')
      .withStringProperty('Title', 'doc', false, false, '30')
      .withChoiceProperty('PublicationDateChoice', 'doc', false, false)
      .withEndCommon()

      .withStartChoice('PublicationDateChoice')
      .withDocumentation('doc')
      .withStringProperty('PublicationDate', 'doc', true, false, '30')
      .withStringProperty('PublicationYear', 'doc', true, false, '30')
      .withEndChoice()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new ChoiceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    choiceReferenceEnhancer(metaEd);
    commonReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "assessmentIdentifier": {
            "description": "doc",
            "type": "integer",
          },
          "contentStandard": {
            "additionalProperties": false,
            "properties": {
              "publicationDate": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
              "publicationYear": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
              "title": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "type": "object",
          },
        },
        "required": [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with a common and a common collection with parent entity prefix', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('Assessment')
      .withDocumentation('doc')
      .withIntegerIdentity('AssessmentIdentifier', 'doc')
      .withCommonProperty('AssessmentScore', 'doc', true, true)
      .withCommonProperty('AssessmentPeriod', 'doc', false, false)
      .withEndDomainEntity()

      .withStartCommon('AssessmentScore')
      .withDocumentation('doc')
      .withStringProperty('MinimumScore', 'doc', true, false, '30')
      .withEndCommon()

      .withStartCommon('AssessmentPeriod')
      .withDocumentation('doc')
      .withStringProperty('BeginDate', 'doc', false, false, '30')
      .withEndCommon()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    commonReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "assessmentIdentifier": {
            "description": "doc",
            "type": "integer",
          },
          "period": {
            "additionalProperties": false,
            "properties": {
              "beginDate": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "type": "object",
          },
          "scores": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "minimumScore": {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": [
                "minimumScore",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": false,
          },
        },
        "required": [
          "assessmentIdentifier",
          "scores",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with an all-caps property', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('Assessment')
      .withDocumentation('doc')
      .withIntegerIdentity('AssessmentIdentifier', 'doc')
      .withStringProperty('URI', 'doc', false, false, '30')
      .withEndDomainEntity()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "assessmentIdentifier": {
            "description": "doc",
            "type": "integer",
          },
          "uri": {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
        },
        "required": [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with a common with a domain entity reference with a role name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('Assessment')
      .withDocumentation('doc')
      .withIntegerIdentity('AssessmentIdentifier', 'doc')
      .withCommonProperty('ContentStandard', 'doc', false, false)
      .withEndDomainEntity()

      .withStartCommon('ContentStandard')
      .withDocumentation('doc')
      .withStringProperty('Title', 'doc', false, false, '30')
      .withDomainEntityProperty('EducationOrganization', 'doc', false, false, false, 'Mandating')
      .withEndCommon()

      .withStartDomainEntity('EducationOrganization')
      .withDocumentation('doc')
      .withIntegerIdentity('EducationOrganizationId', 'doc')
      .withEndDomainEntity()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new CommonBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    domainEntityReferenceEnhancer(metaEd);
    commonReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "assessmentIdentifier": {
            "description": "doc",
            "type": "integer",
          },
          "contentStandard": {
            "additionalProperties": false,
            "properties": {
              "mandatingEducationOrganizationReference": {
                "additionalProperties": false,
                "properties": {
                  "educationOrganizationId": {
                    "description": "doc",
                    "type": "integer",
                  },
                },
                "required": [
                  "educationOrganizationId",
                ],
                "type": "object",
              },
              "title": {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "type": "object",
          },
        },
        "required": [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('Assessment');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with two school year enumerations, one role named', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('StudentSchoolAssociation')
      .withDocumentation('doc')
      .withIntegerIdentity('SchoolId', 'doc')
      .withEnumerationProperty('SchoolYear', 'doc', false, false)
      .withEnumerationProperty('SchoolYear', 'doc', false, false, 'ClassOf')
      .withEndDomainEntity()

      .withStartEnumeration('SchoolYear')
      .withDocumentation('doc')
      .withEnumerationItem('2022')
      .withEndEnumeration()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new EnumerationBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    enumerationReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('StudentSchoolAssociation');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "classOfSchoolYearTypeReference": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "additionalProperties": false,
            "description": "A school year enumeration",
            "properties": {
              "schoolYear": {
                "description": "A school year between 1900 and 2100",
                "maximum": 2100,
                "minimum": 1900,
                "type": "number",
              },
            },
            "title": "EdFi.SchoolYearType",
            "type": "object",
          },
          "schoolId": {
            "description": "doc",
            "type": "integer",
          },
          "schoolYearTypeReference": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "additionalProperties": false,
            "description": "A school year enumeration",
            "properties": {
              "schoolYear": {
                "description": "A school year between 1900 and 2100",
                "maximum": 2100,
                "minimum": 1900,
                "type": "number",
              },
            },
            "title": "EdFi.SchoolYearType",
            "type": "object",
          },
        },
        "required": [
          "schoolId",
        ],
        "title": "EdFi.StudentSchoolAssociation",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('StudentSchoolAssociation');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building domain entity with reference to domain entity with school year enumeration as part of identity', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDomainEntity('StudentSchoolAssociation')
      .withDocumentation('doc')
      .withIntegerIdentity('SchoolId', 'doc')
      .withDomainEntityProperty('Calendar', 'doc', false, false)
      .withEndDomainEntity()

      .withStartDomainEntity('Calendar')
      .withDocumentation('doc')
      .withIntegerIdentity('SchoolId', 'doc')
      .withIdentityProperty('enumeration', 'SchoolYear', 'doc')
      .withEndDomainEntity()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    domainEntityReferenceEnhancer(metaEd);
    enumerationReferenceEnhancer(metaEd);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.domainEntity.get('StudentSchoolAssociation');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": {
          "calendarReference": {
            "additionalProperties": false,
            "properties": {
              "schoolId": {
                "description": "doc",
                "type": "integer",
              },
              "schoolYear": {
                "description": "doc",
                "maximum": 2100,
                "minimum": 1900,
                "type": "integer",
              },
            },
            "required": [
              "schoolId",
              "schoolYear",
            ],
            "type": "object",
          },
          "schoolId": {
            "description": "doc",
            "type": "integer",
          },
        },
        "required": [
          "schoolId",
        ],
        "title": "EdFi.StudentSchoolAssociation",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.domainEntity.get('StudentSchoolAssociation');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building a descriptor', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartDescriptor('GradeLevel')
      .withDocumentation('doc')
      .withEndDescriptor()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));
    namespace = metaEd.namespace.get(namespaceName);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.descriptor.get('GradeLevel');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "An Ed-Fi Descriptor",
        "properties": {
          "codeValue": {
            "description": "The descriptor code value",
            "type": "string",
          },
          "description": {
            "description": "The descriptor description",
            "type": "string",
          },
          "namespace": {
            "description": "The descriptor namespace as a URI",
            "type": "string",
          },
          "shortDescription": {
            "description": "The descriptor short description",
            "type": "string",
          },
        },
        "required": [
          "namespace",
          "codeValue",
          "shortDescription",
        ],
        "title": "EdFi.Descriptor",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.descriptor.get('GradeLevel');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

describe('when building a school year enumeration', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespaceName = 'EdFi';
  let namespace: any = null;

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespaceName)
      .withStartEnumeration('SchoolYear')
      .withDocumentation('doc')
      .withEnumerationItem('2022')
      .withEndEnumeration()
      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new EnumerationBuilder(metaEd, []));

    namespace = metaEd.namespace.get(namespaceName);

    entityPropertyMeadowlarkDataSetupEnhancer(metaEd);
    entityMeadowlarkDataSetupEnhancer(metaEd);
    referenceComponentEnhancer(metaEd);
    apiPropertyMappingEnhancer(metaEd);
    propertyCollectingEnhancer(metaEd);
    apiEntityMappingEnhancer(metaEd);
    enhance(metaEd);
  });

  it('should be a correct schema', () => {
    const entity = namespace.entity.schoolYearEnumeration.get('SchoolYear');
    expect(entity.data.meadowlark.jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "A school year enumeration",
        "properties": {
          "schoolYear": {
            "description": "A school year between 1900 and 2100",
            "maximum": 2100,
            "minimum": 1900,
            "type": "number",
          },
        },
        "title": "EdFi.SchoolYearType",
        "type": "object",
      }
    `);
  });

  it('should be well-formed according to ajv', () => {
    const entity = namespace.entity.schoolYearEnumeration.get('SchoolYear');
    ajv.compile(entity.data.meadowlark.jsonSchema);
  });
});

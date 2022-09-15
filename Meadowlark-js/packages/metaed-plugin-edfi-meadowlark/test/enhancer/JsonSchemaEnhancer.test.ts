// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-underscore-dangle */
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "optionalBooleanProperty": Object {
            "description": "doc1",
            "type": "boolean",
          },
          "optionalDecimalProperty": Object {
            "description": "doc3",
            "type": "number",
          },
          "optionalPercentProperty": Object {
            "description": "doc5",
            "type": "number",
          },
          "optionalShortProperty": Object {
            "description": "doc9",
            "type": "integer",
          },
          "optionalYear": Object {
            "description": "doc13",
            "type": "integer",
          },
          "requiredCurrencyProperty": Object {
            "description": "doc2",
            "type": "number",
          },
          "requiredDateProperty": Object {
            "description": "doc6",
            "format": "date",
            "type": "string",
          },
          "requiredDatetimeProperty": Object {
            "description": "doc7",
            "format": "date-time",
            "type": "string",
          },
          "requiredDurationProperty": Object {
            "description": "doc4",
            "type": "number",
          },
          "requiredIntegerProperty": Object {
            "description": "doc8",
            "maximum": 10,
            "minimum": 5,
            "type": "integer",
          },
          "requiredTimeProperty": Object {
            "description": "doc11",
            "format": "time",
            "type": "string",
          },
          "schoolYearTypeReference": Object {
            "additionalProperties": false,
            "description": "A school year reference",
            "properties": Object {
              "schoolYear": Object {
                "description": "A school year",
                "maximum": 2100,
                "minimum": 1900,
                "type": "number",
              },
            },
            "required": Array [
              "schoolYear",
            ],
            "type": "object",
          },
          "stringIdentity": Object {
            "description": "doc10",
            "maxLength": 30,
            "minLength": 20,
            "type": "string",
          },
        },
        "required": Array [
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "optionalBooleanProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "optionalBooleanProperty": Object {
                  "description": "doc1",
                  "type": "boolean",
                },
              },
              "required": Array [
                "optionalBooleanProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "optionalDecimalProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "optionalDecimalProperty": Object {
                  "description": "doc3",
                  "type": "number",
                },
              },
              "required": Array [
                "optionalDecimalProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "optionalPercentProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "optionalPercentProperty": Object {
                  "description": "doc5",
                  "type": "number",
                },
              },
              "required": Array [
                "optionalPercentProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "optionalShortProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "optionalShortProperty": Object {
                  "description": "doc9",
                  "type": "integer",
                },
              },
              "required": Array [
                "optionalShortProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "optionalYears": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "optionalYear": Object {
                  "description": "doc14",
                  "type": "integer",
                },
              },
              "required": Array [
                "optionalYear",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "requiredCurrencyProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "requiredCurrencyProperty": Object {
                  "description": "doc2",
                  "type": "number",
                },
              },
              "required": Array [
                "requiredCurrencyProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "requiredDateProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "requiredDateProperty": Object {
                  "description": "doc6",
                  "format": "date",
                  "type": "string",
                },
              },
              "required": Array [
                "requiredDateProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "requiredDatetimeProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "requiredDatetimeProperty": Object {
                  "description": "doc7",
                  "format": "date-time",
                  "type": "string",
                },
              },
              "required": Array [
                "requiredDatetimeProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "requiredDurationProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "requiredDurationProperty": Object {
                  "description": "doc4",
                  "type": "number",
                },
              },
              "required": Array [
                "requiredDurationProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "requiredIntegerProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "requiredIntegerProperty": Object {
                  "description": "doc8",
                  "maximum": 10,
                  "minimum": 5,
                  "type": "integer",
                },
              },
              "required": Array [
                "requiredIntegerProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "requiredStringProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "requiredStringProperty": Object {
                  "description": "doc11",
                  "maxLength": 31,
                  "minLength": 21,
                  "type": "string",
                },
              },
              "required": Array [
                "requiredStringProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "requiredTimeProperties": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "requiredTimeProperty": Object {
                  "description": "doc12",
                  "format": "time",
                  "type": "string",
                },
              },
              "required": Array [
                "requiredTimeProperty",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "schoolYearTypeReference": Object {
            "additionalProperties": false,
            "description": "A school year reference",
            "properties": Object {
              "schoolYear": Object {
                "description": "A school year",
                "maximum": 2100,
                "minimum": 1900,
                "type": "number",
              },
            },
            "required": Array [
              "schoolYear",
            ],
            "type": "object",
          },
          "stringIdentity": Object {
            "description": "doc10",
            "maxLength": 30,
            "minLength": 20,
            "type": "string",
          },
        },
        "required": Array [
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
});

describe('when building simple domain entity referencing another referencing another with identity', () => {
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "classPeriods": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "classPeriodReference": Object {
                  "additionalProperties": false,
                  "properties": Object {
                    "classPeriodName": Object {
                      "description": "doc",
                      "maxLength": 30,
                      "type": "string",
                    },
                    "schoolId": Object {
                      "description": "doc",
                      "maxLength": 30,
                      "type": "string",
                    },
                  },
                  "required": Array [
                    "classPeriodName",
                    "schoolId",
                  ],
                  "type": "object",
                },
              },
              "required": Array [
                "classPeriodReference",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "courseOfferingReference": Object {
            "additionalProperties": false,
            "properties": Object {
              "localCourseCode": Object {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
              "schoolId": Object {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "required": Array [
              "localCourseCode",
              "schoolId",
            ],
            "type": "object",
          },
          "sectionIdentifier": Object {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
        },
        "required": Array [
          "sectionIdentifier",
          "courseOfferingReference",
          "classPeriods",
        ],
        "title": "EdFi.DomainEntityName",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "contentIdentifier": Object {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "derivativeSourceEducationContents": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "derivativeSourceEducationContentReference": Object {
                  "additionalProperties": false,
                  "properties": Object {
                    "contentIdentifier": Object {
                      "description": "doc",
                      "maxLength": 30,
                      "type": "string",
                    },
                  },
                  "type": "object",
                },
              },
              "required": Array [
                "derivativeSourceEducationContentReference",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "derivativeSourceURIs": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "derivativeSourceURI": Object {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": Array [
                "derivativeSourceURI",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "description": Object {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "learningResourceMetadataURI": Object {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "requiredURIs": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "requiredURI": Object {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": Array [
                "requiredURI",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
        },
        "required": Array [
          "contentIdentifier",
          "learningResourceMetadataURI",
          "requiredURIs",
        ],
        "title": "EdFi.EducationContent",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "contentIdentifier": Object {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "suffixNames": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "suffixName": Object {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": Array [
                "suffixName",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
        },
        "required": Array [
          "contentIdentifier",
          "suffixNames",
        ],
        "title": "EdFi.EducationContent",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "contentIdentifier": Object {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
          "educationContentSuffixNames": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "educationContentSuffixNameReference": Object {
                  "additionalProperties": false,
                  "properties": Object {
                    "stringIdentity": Object {
                      "description": "doc",
                      "maxLength": 30,
                      "type": "string",
                    },
                  },
                  "required": Array [
                    "stringIdentity",
                  ],
                  "type": "object",
                },
              },
              "required": Array [
                "educationContentSuffixNameReference",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
        },
        "required": Array [
          "contentIdentifier",
          "educationContentSuffixNames",
        ],
        "title": "EdFi.EducationContent",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "assessmentIdentifier": Object {
            "description": "doc",
            "type": "integer",
          },
          "identificationCodes": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "assessmentIdentificationSystemDescriptor": Object {
                  "description": "doc",
                  "type": "string",
                },
                "identificationCode": Object {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": Array [
                "identificationCode",
                "assessmentIdentificationSystemDescriptor",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
        },
        "required": Array [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "communityOrganizationId": Object {
            "description": "doc",
            "type": "integer",
          },
          "identificationCodes": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "educationOrganizationIdentificationSystemDescriptor": Object {
                  "description": "doc",
                  "type": "string",
                },
                "identificationCode": Object {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": Array [
                "identificationCode",
                "educationOrganizationIdentificationSystemDescriptor",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
        },
        "required": Array [
          "communityOrganizationId",
        ],
        "title": "EdFi.CommunityOrganization",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "addresses": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "periods": Object {
                  "items": Object {
                    "additionalProperties": false,
                    "properties": Object {
                      "beginDate": Object {
                        "description": "doc",
                        "type": "integer",
                      },
                      "endDate": Object {
                        "description": "doc",
                        "type": "integer",
                      },
                    },
                    "required": Array [
                      "beginDate",
                    ],
                    "type": "object",
                  },
                  "minItems": 1,
                  "type": "array",
                  "uniqueItems": true,
                },
                "streetNumberName": Object {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": Array [
                "streetNumberName",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "student": Object {
            "description": "doc",
            "type": "integer",
          },
        },
        "required": Array [
          "student",
        ],
        "title": "EdFi.StudentEducationOrganizationAssociation",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "assessedGradeLevelDescriptor": Object {
            "description": "doc",
            "type": "string",
          },
          "assessmentIdentifier": Object {
            "description": "doc",
            "type": "integer",
          },
        },
        "required": Array [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "assessedGradeLevels": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "gradeLevelDescriptor": Object {
                  "description": "An Ed-Fi Descriptor",
                  "type": "string",
                },
              },
              "required": Array [
                "gradeLevelDescriptor",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
          "assessmentIdentifier": Object {
            "description": "doc",
            "type": "integer",
          },
        },
        "required": Array [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "assessmentIdentifier": Object {
            "description": "doc",
            "type": "integer",
          },
          "contentStandard": Object {
            "additionalProperties": false,
            "properties": Object {
              "publicationDate": Object {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
              "publicationYear": Object {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
              "title": Object {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "type": "object",
          },
        },
        "required": Array [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "assessmentIdentifier": Object {
            "description": "doc",
            "type": "integer",
          },
          "period": Object {
            "additionalProperties": false,
            "properties": Object {
              "beginDate": Object {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "type": "object",
          },
          "scores": Object {
            "items": Object {
              "additionalProperties": false,
              "properties": Object {
                "minimumScore": Object {
                  "description": "doc",
                  "maxLength": 30,
                  "type": "string",
                },
              },
              "required": Array [
                "minimumScore",
              ],
              "type": "object",
            },
            "minItems": 1,
            "type": "array",
            "uniqueItems": true,
          },
        },
        "required": Array [
          "assessmentIdentifier",
          "scores",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "assessmentIdentifier": Object {
            "description": "doc",
            "type": "integer",
          },
          "uri": Object {
            "description": "doc",
            "maxLength": 30,
            "type": "string",
          },
        },
        "required": Array [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "assessmentIdentifier": Object {
            "description": "doc",
            "type": "integer",
          },
          "contentStandard": Object {
            "additionalProperties": false,
            "properties": Object {
              "mandatingEducationOrganizationReference": Object {
                "additionalProperties": false,
                "properties": Object {
                  "educationOrganizationId": Object {
                    "description": "doc",
                    "type": "integer",
                  },
                },
                "required": Array [
                  "educationOrganizationId",
                ],
                "type": "object",
              },
              "title": Object {
                "description": "doc",
                "maxLength": 30,
                "type": "string",
              },
            },
            "type": "object",
          },
        },
        "required": Array [
          "assessmentIdentifier",
        ],
        "title": "EdFi.Assessment",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "classOfSchoolYearTypeReference": Object {
            "additionalProperties": false,
            "description": "A school year reference",
            "properties": Object {
              "schoolYear": Object {
                "description": "A school year",
                "maximum": 2100,
                "minimum": 1900,
                "type": "number",
              },
            },
            "required": Array [
              "schoolYear",
            ],
            "type": "object",
          },
          "schoolId": Object {
            "description": "doc",
            "type": "integer",
          },
          "schoolYearTypeReference": Object {
            "additionalProperties": false,
            "description": "A school year reference",
            "properties": Object {
              "schoolYear": Object {
                "description": "A school year",
                "maximum": 2100,
                "minimum": 1900,
                "type": "number",
              },
            },
            "required": Array [
              "schoolYear",
            ],
            "type": "object",
          },
        },
        "required": Array [
          "schoolId",
        ],
        "title": "EdFi.StudentSchoolAssociation",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "doc",
        "properties": Object {
          "calendarReference": Object {
            "additionalProperties": false,
            "properties": Object {
              "schoolId": Object {
                "description": "doc",
                "type": "integer",
              },
              "schoolYear": Object {
                "description": "doc",
                "maximum": 2100,
                "minimum": 1900,
                "type": "integer",
              },
            },
            "required": Array [
              "schoolId",
              "schoolYear",
            ],
            "type": "object",
          },
          "schoolId": Object {
            "description": "doc",
            "type": "integer",
          },
        },
        "required": Array [
          "schoolId",
        ],
        "title": "EdFi.StudentSchoolAssociation",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "An Ed-Fi Descriptor",
        "properties": Object {
          "codeValue": Object {
            "description": "The descriptor code value",
            "type": "string",
          },
          "description": Object {
            "description": "The descriptor description",
            "type": "string",
          },
          "namespace": Object {
            "description": "The descriptor namespace as a URI",
            "type": "string",
          },
          "shortDescription": Object {
            "description": "The descriptor short description",
            "type": "string",
          },
        },
        "required": Array [
          "namespace",
          "codeValue",
          "shortDescription",
        ],
        "title": "EdFi.Descriptor",
        "type": "object",
      }
    `);
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
      Object {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "description": "A school year enumeration",
        "properties": Object {
          "currentSchoolYear": Object {
            "description": "Is this the current school year",
            "type": "boolean",
          },
          "schoolYear": Object {
            "description": "A school year between 1900 and 2100",
            "maximum": 2100,
            "minimum": 1900,
            "type": "number",
          },
          "schoolYearDescription": Object {
            "description": "The school year description",
            "type": "string",
          },
        },
        "required": Array [
          "schoolYear",
          "currentSchoolYear",
        ],
        "title": "EdFi.SchoolYearType",
        "type": "object",
      }
    `);
  });
});

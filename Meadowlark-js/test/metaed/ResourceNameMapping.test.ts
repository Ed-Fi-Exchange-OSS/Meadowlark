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
  AssociationBuilder,
  AssociationSubclassBuilder,
  DescriptorBuilder,
} from 'metaed-core';
import { getMatchingMetaEdModelFrom } from '../../src/metaed/ResourceNameMapping';

describe('when looking for a MetaEd model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const NAMESPACE = 'EdFi';

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(NAMESPACE)
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withEndDomainEntity()

      .withStartDomainEntitySubclass('SubSection', 'Section')
      .withStringIdentity('Whatever', 'doc', '9999999')
      .withEndDomainEntitySubclass()

      .withStartAssociation('SectionAssociation')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withEndAssociation()

      .withStartAssociationSubclass('SubAssociation', 'SectionAssociation')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withEndAssociationSubclass()

      .withStartDescriptor('GradeLevel')
      .withDocumentation('doc')
      .withEndDescriptor()

      .withEndNamespace()
      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []))
      .sendToListener(new AssociationBuilder(metaEd, []))
      .sendToListener(new AssociationSubclassBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));
  });

  describe('given entity exists', () => {
    describe('and given upper case domain entity name', () => {
      it('returns false', () => {
        expect(getMatchingMetaEdModelFrom('Sections', metaEd, NAMESPACE)).not.toBeDefined();
      });
    });

    describe('and given lower case domain entity name', () => {
      it('returns true', () => {
        expect(getMatchingMetaEdModelFrom('sections', metaEd, NAMESPACE)).toBeDefined();
      });
    });

    describe('and given upper case domain sub entity name', () => {
      it('returns false', () => {
        expect(getMatchingMetaEdModelFrom('SubSections', metaEd, NAMESPACE)).not.toBeDefined();
      });
    });

    describe('and given lower case domain sub entity name', () => {
      it('returns true', () => {
        expect(getMatchingMetaEdModelFrom('subSections', metaEd, NAMESPACE)).toBeDefined();
      });
    });

    describe('and given upper case association name', () => {
      it('returns false', () => {
        expect(getMatchingMetaEdModelFrom('SectionAssociations', metaEd, NAMESPACE)).not.toBeDefined();
      });
    });

    describe('and given lower case association name', () => {
      it('returns true', () => {
        expect(getMatchingMetaEdModelFrom('sectionAssociations', metaEd, NAMESPACE)).toBeDefined();
      });
    });

    describe('and given upper case association sub name', () => {
      it('returns false', () => {
        expect(getMatchingMetaEdModelFrom('SubAssociations', metaEd, NAMESPACE)).not.toBeDefined();
      });
    });

    describe('and given lower case association sub name', () => {
      it('returns true', () => {
        expect(getMatchingMetaEdModelFrom('subAssociations', metaEd, NAMESPACE)).toBeDefined();
      });
    });

    describe('and given upper case descriptor name', () => {
      it('returns false', () => {
        expect(getMatchingMetaEdModelFrom('GradeLevelDescriptors', metaEd, NAMESPACE)).not.toBeDefined();
      });
    });

    describe('and given lower case descriptor name', () => {
      it('returns true', () => {
        expect(getMatchingMetaEdModelFrom('gradeLevelDescriptors', metaEd, NAMESPACE)).toBeDefined();
      });
    });
  });

  describe('given entity does not exist', () => {
    it('returns false', () => {
      expect(getMatchingMetaEdModelFrom('DoesNotExist', metaEd, NAMESPACE)).not.toBeDefined();
    });
  });
});

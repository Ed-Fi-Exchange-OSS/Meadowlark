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
  EnumerationBuilder,
} from '@edfi/metaed-core';
import { getMetaEdModelForResourceName, resetCache } from '../../src/metaed/ResourceNameMapping';

describe('when looking for a domain entity model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';

  beforeAll(() => {
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartDomainEntity('Section')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withEndDomainEntity()
      .withEndNamespace()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []));
  });

  describe('and given upper case resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('Sections', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name', () => {
    it('returns true', () => {
      expect(getMetaEdModelForResourceName('sections', metaEd, namespace)).toBeDefined();
    });
  });

  describe('and given non-pluralized resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('section', metaEd, namespace)).not.toBeDefined();
    });
  });
});

describe('when looking for a domain entity subclass model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';

  beforeAll(() => {
    resetCache();
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartDomainEntity('EducationOrganization')
      .withDocumentation('doc')
      .withIntegerIdentity('EducationOrganizationId', 'doc')
      .withEndDomainEntity()

      .withStartDomainEntitySubclass('School', 'EducationOrganization')
      .withIntegerIdentity('SchoolId', 'doc')
      .withEndDomainEntitySubclass()
      .withEndNamespace()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DomainEntityBuilder(metaEd, []))
      .sendToListener(new DomainEntitySubclassBuilder(metaEd, []));
  });

  describe('and given upper case resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('Schools', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name', () => {
    it('returns true', () => {
      expect(getMetaEdModelForResourceName('schools', metaEd, namespace)).toBeDefined();
    });
  });

  describe('and given non-pluralized resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('school', metaEd, namespace)).not.toBeDefined();
    });
  });
});

describe('when looking for a non-GeneralStudentProgramAssociation association model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';

  beforeAll(() => {
    resetCache();
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartAssociation('SectionAssociation')
      .withDocumentation('doc')
      .withStringIdentity('SectionIdentifier', 'doc', '30')
      .withEndAssociation()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new AssociationBuilder(metaEd, []));
  });

  describe('and given upper case resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('SectionAssociations', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name', () => {
    it('returns true', () => {
      expect(getMetaEdModelForResourceName('sectionAssociations', metaEd, namespace)).toBeDefined();
    });
  });

  describe('and given non-pluralized resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('sectionAssociation', metaEd, namespace)).not.toBeDefined();
    });
  });
});

describe('when looking for the GeneralStudentProgramAssociation model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';

  beforeAll(() => {
    resetCache();
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartAssociation('GeneralStudentProgramAssociation')
      .withDocumentation('doc')
      .withIntegerIdentity('EducationOrganizationId', 'doc')
      .withEndAssociation()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new AssociationBuilder(metaEd, []));
  });

  describe('and given upper case resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('GeneralStudentProgramAssociations', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('generalStudentProgramAssociations', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given non-pluralized resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('generalStudentProgramAssociation', metaEd, namespace)).not.toBeDefined();
    });
  });
});

describe('when looking for an association subclass model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';

  beforeAll(() => {
    resetCache();
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartAssociation('GeneralStudentProgramAssociation')
      .withDocumentation('doc')
      .withIntegerIdentity('EducationOrganizationId', 'doc')
      .withEndAssociation()

      .withStartAssociationSubclass('StudentProgramAssociation', 'GeneralStudentProgramAssociation')
      .withDocumentation('doc')
      .withIntegerIdentity('Service', 'doc')
      .withEndAssociationSubclass()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new AssociationBuilder(metaEd, []))
      .sendToListener(new AssociationSubclassBuilder(metaEd, []));
  });

  describe('and given upper case resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('StudentProgramAssociations', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name', () => {
    it('returns true', () => {
      expect(getMetaEdModelForResourceName('studentProgramAssociations', metaEd, namespace)).toBeDefined();
    });
  });

  describe('and given non-pluralized resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('studentProgramAssociation', metaEd, namespace)).not.toBeDefined();
    });
  });
});

describe('when looking for a descriptor model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';

  beforeAll(() => {
    resetCache();
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartDescriptor('GradeLevel')
      .withDocumentation('doc')
      .withEndDescriptor()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new DescriptorBuilder(metaEd, []));
  });

  describe('and given upper case resource name without "Descriptor" suffix', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('GradeLevels', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name without "Descriptor" suffix', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('gradeLevels', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given upper case resource name with "Descriptor" suffix', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('GradeLevelDescriptors', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name with "Descriptor" suffix', () => {
    it('returns true', () => {
      expect(getMetaEdModelForResourceName('gradeLevelDescriptors', metaEd, namespace)).toBeDefined();
    });
  });

  describe('and given non-pluralized resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('gradeLevelDescriptor', metaEd, namespace)).not.toBeDefined();
    });
  });
});

describe('when looking for the SchoolYear model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';

  beforeAll(() => {
    resetCache();
    MetaEdTextBuilder.build()
      .withBeginNamespace(namespace)
      .withStartEnumeration('SchoolYear')
      .withDocumentation('doc')
      .withEnumerationItem('2022')
      .withEndEnumeration()

      .sendToListener(new NamespaceBuilder(metaEd, []))
      .sendToListener(new EnumerationBuilder(metaEd, []));
  });

  describe('and given upper case resource name without "Type" suffix', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('SchoolYears', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name without "Type" suffix', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('schoolYears', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given upper case resource name with "Type" suffix', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('SchoolYearTypes', metaEd, namespace)).not.toBeDefined();
    });
  });

  describe('and given lower case resource name with "Type" suffix', () => {
    it('returns true', () => {
      expect(getMetaEdModelForResourceName('schoolYearTypes', metaEd, namespace)).toBeDefined();
    });
  });

  describe('and given non-pluralized resource name', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('schoolYearType', metaEd, namespace)).not.toBeDefined();
    });
  });
});

describe('when looking for a non-existant model matching a resource name', () => {
  const metaEd: MetaEdEnvironment = newMetaEdEnvironment();
  const namespace = 'EdFi';

  beforeAll(() => {
    resetCache();
  });

  describe('given entity does not exist', () => {
    it('returns false', () => {
      expect(getMetaEdModelForResourceName('DoesNotExist', metaEd, namespace)).not.toBeDefined();
    });
  });
});

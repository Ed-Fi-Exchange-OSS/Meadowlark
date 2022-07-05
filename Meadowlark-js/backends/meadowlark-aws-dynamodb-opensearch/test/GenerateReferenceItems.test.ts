// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentIdentity, DocumentInfo, newDocumentInfo, newResourceInfo, ResourceInfo } from '@edfi/meadowlark-core';
import { generateReferenceItems } from '../src/BaseDynamoRepository';
import { TransactWriteItem } from '../src/types/AwsSdkLibDynamoDb';

describe('when collecting foreign key references', () => {
  describe('given a item with no references', () => {
    let result: TransactWriteItem[];
    const pkHash: string = 'ID#asdfqwer;lkj';
    const resourceInfo: ResourceInfo = newResourceInfo();
    const documentInfo: DocumentInfo = newDocumentInfo();

    beforeAll(() => {
      result = generateReferenceItems(pkHash, resourceInfo, documentInfo);
    });

    it('returns an empty array', () => {
      expect(result.length).toEqual(0);
    });
  });

  describe('given an item with two references', () => {
    /*
     * Submitting a Parent, which has a reference to Person. When deleting a
     * Person, need to report on the _parent_ as a foreign key reference
     * preventing the deletion.
     *
     * Thus need to capture:
     *
     *  From: Parent
     *  To: Person
     *  Info: { Type and NaturalKey for Parent }
     */
    let result: TransactWriteItem[];
    const parentHash: string = 'ID#09876554tuiolkjasdfasdfwe2w33afss';
    const parentKey: string = 'parentId=asdfasdf';
    const parentIdentity = [{ name: 'parentId', value: 'asdfasdf' }];
    const personNK: DocumentIdentity = [{ name: 'person.personId', value: 'b' }];
    const resourceInfo: ResourceInfo = newResourceInfo();
    const documentInfo: DocumentInfo = newDocumentInfo();

    resourceInfo.projectName = 'Ed-Fi';
    resourceInfo.resourceName = 'Parent';
    resourceInfo.resourceVersion = '3.3.1-b';
    documentInfo.documentReferences.push({
      projectName: resourceInfo.projectName,
      resourceName: 'Person',
      documentIdentity: personNK,
      isDescriptor: false,
    });
    documentInfo.documentReferences.push({
      projectName: resourceInfo.projectName,
      resourceName: 'EducationOrganization',
      documentIdentity: [{ name: 'educationOrganization.educationOrganizationId', value: '234' }],
      isDescriptor: false,
    });
    documentInfo.documentIdentity = parentIdentity;

    const fromParent = 'FREF#ID#09876554tuiolkjasdfasdfwe2w33afss';
    const toPerson = 'TREF#ID#C55ZOVLcukMmWLyvqqW68TUFB1gmx4MlYlkefA';

    const description = {
      Type: 'TYPE#Ed-Fi#3.3.1-b#Parent',
      NaturalKey: `NK#${parentKey}`,
    };

    beforeAll(() => {
      result = generateReferenceItems(parentHash, resourceInfo, documentInfo);
    });

    it('returns two items', () => {
      expect(result.length).toEqual(4);
    });

    it('returns the (FREF, TREF) pair for the Person with correct pk', () => {
      expect(result[0]?.Put?.Item?.pk).toEqual(fromParent);
    });

    it('returns the (FREF, TREF) pair for the Person with correct sk', () => {
      expect(result[0]?.Put?.Item?.sk).toEqual(toPerson);
    });

    it('returns the (FREF, TREF) pair for the Person with no info', () => {
      expect(result[0]?.Put?.Item?.info).toBeUndefined();
    });

    it('returns the (TREF, FREF) pair for the Person with correct pk', () => {
      expect(result[1]?.Put?.Item?.pk).toEqual(toPerson);
    });

    it('returns the (FREF, TREF) pair for the Person with correct sk', () => {
      expect(result[1]?.Put?.Item?.sk).toEqual(fromParent);
    });

    it('returns the (TREF, FREF) pair for the Person with correct info', () => {
      expect(result[1]?.Put?.Item?.info).toEqual(description);
    });

    // Not bothering to test details on the second entity - just trust that it will be correct
  });

  describe('given an item with one descriptor and no references', () => {
    let result: TransactWriteItem[];
    const parentHash: string = 'ID#09876554tuiolkjasdfasdfwe2w33afss';
    const parentIdentity = [{ name: 'parentId', value: 'asdfasdf' }];
    const resourceInfo: ResourceInfo = newResourceInfo();
    const documentInfo: DocumentInfo = newDocumentInfo();

    resourceInfo.projectName = 'Ed-Fi';
    resourceInfo.resourceName = 'Parent';
    resourceInfo.resourceVersion = '3.3.1-b';
    documentInfo.descriptorReferences.push({
      projectName: resourceInfo.projectName,
      resourceName: 'SomethingDescriptor',
      documentIdentity: [
        {
          name: 'descriptor',
          value: 'something',
        },
      ],
      isDescriptor: true,
    });
    documentInfo.documentIdentity = parentIdentity;

    beforeAll(() => {
      result = generateReferenceItems(parentHash, resourceInfo, documentInfo);
    });

    it('returns zero items because descriptors are ignored', () => {
      expect(result.length).toEqual(0);
    });
  });
});

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */
import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import { buildNKString, EntityInfo, newEntityInfo } from '../model/EntityInfo';
import { createEntity } from '../repository/DynamoEntityRepository';
import { arrayifyScalarObjectValues, decapitalizeKeys } from '../Utility';
import { PutResult } from '../repository/BaseDynamoRepository';
import { Logger } from '../helpers/Logger';
import { documentIdForEntityInfo } from '../helpers/DocumentId';
import { newSecurity } from '../model/Security';

export const descriptorPath: string = path.resolve(__dirname, '../../edfi-descriptors/3.3.1-a');

type XmlDescriptorValue = {
  Namespace: string;
  CodeValue: string;
  ShortDescription: string;
  Description: string;
};

type XmlDescriptorData = { [descriptorName: string]: XmlDescriptorValue[] };

type DescriptorDocument = {
  namespace: string;
  codeValue: string;
  shortDescription: string;
  description: string;
};

/**
 * Reads Ed-Fi Data Standard XML descriptor files and combines into a single object
 * where keys are the descriptor entity name (e.g. CountryDescriptor) and values
 * are arrays of desriptor values (CodeValue, ShortDescription, etc.)
 */
async function readDescriptors(directoryPath: string): Promise<XmlDescriptorData> {
  const filenamesToLoad: string[] = fs.readdirSync(directoryPath).filter((filename) => filename.endsWith('.xml'));

  const result = {};

  for (const filename of filenamesToLoad) {
    const filePath = path.join(directoryPath, filename);

    Logger.info(`loading ${filePath}`, '-');
    const contents = fs.readFileSync(filePath);

    const parsedContents = await xml2js.parseStringPromise(contents, { explicitArray: false });

    // expecting descriptors to be inside 'InterchangeDescriptors' element
    if (!Object.prototype.hasOwnProperty.call(parsedContents, 'InterchangeDescriptors')) {
      Logger.warn(`Descriptor file ${filePath} has no top-level InterchangeDescriptors element. Skipping.`, '-');
      continue;
    }

    const interchangeDescriptorsElement = parsedContents.InterchangeDescriptors;

    // remove any XML metadata '$' property
    if (interchangeDescriptorsElement.hasOwnProperty('$')) {
      delete interchangeDescriptorsElement.$;
    }

    // turn any single descriptor data element into an array of length 1 for consistency
    arrayifyScalarObjectValues(interchangeDescriptorsElement);

    Object.assign(result, interchangeDescriptorsElement);
  }

  return result;
}

async function loadParsedDescriptors(descriptorData: XmlDescriptorData): Promise<void> {
  let loadCount = 0;
  for (const [descriptorName, descriptorValues] of Object.entries(descriptorData)) {
    if (!descriptorName.endsWith('Descriptor')) {
      Logger.warn(`Descriptor name ${descriptorName} does not end in 'Descriptor'. Skipping.`, '-');
      continue;
    }
    for (const descriptorValue of descriptorValues) {
      if (!Object.prototype.hasOwnProperty.call(descriptorValue, 'Namespace')) {
        Logger.warn(`Descriptor ${descriptorName} has no Namespace. Skipping.`, '-');
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(descriptorValue, 'CodeValue')) {
        Logger.warn(`Descriptor ${descriptorName} has no CodeValue. Skipping.`, '-');
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(descriptorValue, 'ShortDescription')) {
        Logger.warn(`Descriptor ${descriptorName} has no ShortDescription. Skipping.`, '-');
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(descriptorValue, 'Description')) {
        Logger.warn(`Descriptor ${descriptorName} has no Description. Skipping.`, '-');
        continue;
      }

      const descriptorDocument: DescriptorDocument = decapitalizeKeys(descriptorValue) as DescriptorDocument;
      const descriptorEntityInfo: EntityInfo = {
        ...newEntityInfo(),
        entityName: descriptorName,
        projectName: 'Ed-Fi',
        projectVersion: '3.3.1-b',
        naturalKey: buildNKString(`${descriptorDocument.namespace}#${descriptorDocument.codeValue}`),
      };

      const putResult: PutResult = await createEntity(
        documentIdForEntityInfo(descriptorEntityInfo),
        descriptorEntityInfo,
        descriptorDocument,
        { referenceValidation: false, descriptorValidation: false },
        { ...newSecurity(), isOwnershipEnabled: false },
        '-',
      );
      Logger.debug(
        `Loading descriptor ${descriptorName} with natural key ${descriptorEntityInfo.naturalKey}: ${putResult.failureMessage}`,
        '-',
      );
      if (!(putResult.result === 'INSERT_SUCCESS' || putResult.result === 'UPDATE_SUCCESS')) {
        Logger.error(
          `Attempt to load descriptor ${descriptorName} with natural key ${descriptorEntityInfo.naturalKey} failed: ${putResult.failureMessage}`,
          'n/a',
        );
      } else {
        loadCount += 1;
      }
    }
  }
  Logger.info(`${loadCount} descriptors loaded`, '-');
}

export async function loadDescriptors(): Promise<void> {
  Logger.info('Loading descriptors', 'n/a');
  const data: XmlDescriptorData = await readDescriptors(descriptorPath);
  await loadParsedDescriptors(data);
}

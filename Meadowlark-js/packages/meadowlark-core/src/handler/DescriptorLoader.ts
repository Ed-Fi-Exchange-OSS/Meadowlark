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
import { getDocumentStore, loadDocumentStore } from '../plugin/PluginLoader';
import { Logger } from '../Logger';
import { documentIdForDocumentInfo, DocumentInfo } from '../model/DocumentInfo';
import { newSecurity } from '../security/Security';
import { UpsertResult } from '../message/UpsertResult';
import { decapitalize } from '../Utility';
import { ResourceInfo } from '../model/ResourceInfo';
import { DescriptorDocument } from '../model/DescriptorDocument';
import { descriptorDocumentInfoFrom } from '../model/DescriptorDocumentInfo';

export const descriptorPath: string = path.resolve(__dirname, '../../edfi-descriptors/3.3.1-a');

type XmlDescriptorValue = {
  Namespace: string;
  CodeValue: string;
  ShortDescription: string;
  Description: string;
};

type XmlDescriptorData = { [descriptorName: string]: XmlDescriptorValue[] };

/** Returns a new object */
export function decapitalizeKeys(obj: object): object {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [decapitalize(key), value]));
}

/** Convert any non-array object value into an array of length 1. Mutates object */
export function arrayifyScalarObjectValues(obj: object): object {
  Object.keys(obj).forEach((key) => {
    if (!Array.isArray(obj[key])) {
      obj[key] = [obj[key]];
    }
  });
  return obj;
}

/**
 * Reads Ed-Fi Data Standard XML descriptor files and combines into a single object
 * where keys are the descriptor entity name (e.g. CountryDescriptor) and values
 * are arrays of descriptor values (CodeValue, ShortDescription, etc.)
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
  for (const [descriptorName, descriptorReferences] of Object.entries(descriptorData)) {
    if (!descriptorName.endsWith('Descriptor')) {
      Logger.warn(`Descriptor name ${descriptorName} does not end in 'Descriptor'. Skipping.`, '-');
      continue;
    }
    for (const descriptorReference of descriptorReferences) {
      if (!Object.prototype.hasOwnProperty.call(descriptorReference, 'Namespace')) {
        Logger.warn(`Descriptor ${descriptorName} has no Namespace. Skipping.`, '-');
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(descriptorReference, 'CodeValue')) {
        Logger.warn(`Descriptor ${descriptorName} has no CodeValue. Skipping.`, '-');
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(descriptorReference, 'ShortDescription')) {
        Logger.warn(`Descriptor ${descriptorName} has no ShortDescription. Skipping.`, '-');
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(descriptorReference, 'Description')) {
        Logger.warn(`Descriptor ${descriptorName} has no Description. Skipping.`, '-');
        continue;
      }

      const resourceInfo: ResourceInfo = {
        resourceName: descriptorName,
        projectName: 'Ed-Fi',
        resourceVersion: '3.3.1-b',
        isDescriptor: true,
      };

      const descriptorDocument: DescriptorDocument = decapitalizeKeys(descriptorReference) as DescriptorDocument;
      const documentInfo: DocumentInfo = descriptorDocumentInfoFrom(descriptorDocument);

      const putResult: UpsertResult = await getDocumentStore().upsertDocument({
        id: documentIdForDocumentInfo(resourceInfo, documentInfo),
        resourceInfo,
        documentInfo,
        edfiDoc: descriptorDocument,
        validate: true,
        security: { ...newSecurity(), authorizationStrategy: 'FULL_ACCESS' },
        traceId: '-',
      });

      Logger.debug(
        `Loading descriptor ${descriptorName} with identity ${JSON.stringify(documentInfo.documentIdentity)}: ${
          putResult.failureMessage ?? 'OK'
        }`,
        '-',
      );

      if (!(putResult.response === 'INSERT_SUCCESS' || putResult.response === 'UPDATE_SUCCESS')) {
        Logger.error(
          `Attempt to load descriptor ${descriptorName} with identity ${JSON.stringify(
            documentInfo.documentIdentity,
          )} failed: ${putResult.failureMessage}`,
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
  await loadDocumentStore();
  const data: XmlDescriptorData = await readDescriptors(descriptorPath);
  await loadParsedDescriptors(data);
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import { deriveNamespaceFromProjectName } from '@edfi/metaed-core';
import { Constants } from '../Constants';

const PROJECT_SETTINGS_FILE_NAME = 'package.json';

/**
 * The metadata information from a MetaEd project's package.json
 */
interface ProjectFileData {
  projectName: string;
  projectVersion: string;
}

/**
 * A full set of metadata information for a MetaEd project, including whether the project
 * itself is valid.
 */
export interface MetaEdProjectMetadata {
  projectPath: string;
  invalidProject: boolean;
  invalidProjectReason: string;
  projectName: string;
  projectVersion: string;
  projectNamespace: string;
  isExtensionProject: boolean;
  projectExtension: string;
}

/**
 * A hardcoded mapping of URI version abbreviations to Ed-Fi Model npm package names
 */
export function modelPackageFor(versionAbbreviation: string): string {
  if (versionAbbreviation === Constants.uriVersion31) return '@edfi/ed-fi-model-3.1';
  if (versionAbbreviation === Constants.uriVersion33b) return '@edfi/ed-fi-model-3.3b';
  return 'ed-fi-model-undefined';
}

/**
 * A hardcoded mapping of Ed-Fi Model project versions to URI abbreviations
 */
export function versionAbbreviationFor(projectVersion: string): string {
  if (projectVersion === Constants.projectVersion31) return Constants.uriVersion31;
  if (projectVersion === Constants.projectVersion33b) return Constants.uriVersion33b;
  return 'v0.0';
}

/**
 * Default initialization of a MetaEdProjectMetadata object
 */
function newMetaEdProjectMetadata(projectPath: string): MetaEdProjectMetadata {
  return {
    projectPath,
    invalidProject: false,
    invalidProjectReason: '',
    projectName: '',
    projectVersion: '',
    projectNamespace: '',
    isExtensionProject: false,
    projectExtension: '',
  };
}

/**
 * Read the package.json file for a MetaEd project and extract the project name and version.
 */
async function projectValuesFromProjectJson(verifiedPathToProjectJson: string): Promise<ProjectFileData | null> {
  const projectJson = await fs.readJson(verifiedPathToProjectJson);
  if (projectJson.metaEdProject && projectJson.metaEdProject.projectName && projectJson.metaEdProject.projectVersion)
    return projectJson.metaEdProject;
  return null;
}

/**
 * Entry point for finding and validating MetaEd projects given file system paths.
 *
 * Similar to the behavior of the atom-metaed package for the Atom editor.
 */
export async function findMetaEdProjectMetadata(projectPaths: string[]): Promise<MetaEdProjectMetadata[]> {
  const result: MetaEdProjectMetadata[] = await Promise.all(
    projectPaths.map(async (projectPath: string) => {
      const projectJsonFilePath = path.join(projectPath, PROJECT_SETTINGS_FILE_NAME);
      if (!fs.existsSync(projectJsonFilePath)) {
        return {
          ...newMetaEdProjectMetadata(projectPath),
          invalidProject: true,
          invalidProjectReason: `does not exist at ${projectPath}`,
        };
      }

      const projectFileData: ProjectFileData | null = await projectValuesFromProjectJson(projectJsonFilePath);
      if (projectFileData == null) {
        return {
          ...newMetaEdProjectMetadata(projectPath),
          invalidProject: true,
          invalidProjectReason: 'must have both metaEdProject.projectName and metaEdProject.projectVersion definitions',
        };
      }

      const projectNamespace: string | null = deriveNamespaceFromProjectName(projectFileData.projectName);
      if (projectNamespace == null) {
        return {
          ...newMetaEdProjectMetadata(projectPath),
          invalidProject: true,
          invalidProjectReason:
            'metaEdProject.projectName definition must begin with an uppercase character. All other characters must be alphanumeric only.',
        };
      }

      const projectVersion = projectFileData.projectVersion || '';
      if (!semver.valid(projectVersion)) {
        return {
          ...newMetaEdProjectMetadata(projectPath),
          invalidProject: true,
          invalidProjectReason:
            'metaEdProject.projectVersion is not a valid version declaration. Version declarations must follow the semver.org standard.',
        };
      }

      return {
        ...newMetaEdProjectMetadata(projectPath),
        projectName: projectFileData.projectName,
        projectVersion,
        projectNamespace,
        isExtensionProject: projectNamespace !== 'EdFi',
        projectExtension: projectNamespace === 'EdFi' ? '' : 'EXTENSION',
      };
    }),
  );
  return result;
}

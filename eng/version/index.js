// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/*
 * Calculates the next version number based on prior tag and commit depth.
 *
 * There is one command line flag: --update. When set, it will inject the
 * calculated version into all of the package.json files. Otherwise, just writes
 * the version to the console.
 */

const { execSync } = require('child_process');
const { calculateNextVersion } = require('./helper');

const updatePackageJson = process.argv.includes('--update');

const callShellCommand = (cmd, options) => execSync(cmd, options).toString().replace('\n', '');

/*
 * `git describe` returns the last tag plus the commit depth and the short hash
 * for the most recent commit. Example: last tag was v0.3.0, there has been one
 * more commit, and the most recent has hash `g1636c72`; then the output will be
 * `v0.3.1-1-g1636c72`
 */
const gitDescribe = callShellCommand('git describe --first-parent --tags');
console.debug('***>>>', gitDescribe);

const version = calculateNextVersion(gitDescribe);
if (version === null) {
  // eslint-disable-next-line no-console
  console.error(`Unable to extract version information from ${gitDescribe}`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.info(version);

if (updatePackageJson) {
  callShellCommand(`npm version ${version} --allow-same-version --workspaces true`, { cwd: '../../Meadowlark-js'});
}

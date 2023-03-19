// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/*
 * Calculates the next version number based on prior tag and commit depth.
 *
 * `git describe` returns the last tag plus the commit depth and the short hash
 * for the most recent commit. Example: last tag was v0.3.0, there has been one
 * more commit, and the most recent has hash `g1636c72`; then the output will be
 * `v0.3.1-1-g1636c72`. But if the last tag was `v0.3.1-10-gbad82c2`, then the
 * next output from `git describe` will be `v0.3.1-10-gbad82c2-1-g1636c72`. And
 * this will keep growing with every pre-release. What we really want is
 * `v0.3.1-pre11` (11 = 10 commits from the base, then another 1 commit).
 *
 * There is one command line flag: --update. When set, it will inject the
 * calculated version into all of the package.json files. Otherwise, just writes
 * the version to the console.
 */

const { execSync } = require('child_process');

const updatePackageJson = process.argv.includes('--update');

const callShellCommand = (cmd) => execSync(cmd).toString().replace('\n', '');

const gitDescribe = callShellCommand('git describe --first-parent --tags');

let version = gitDescribe;

// Is this already a proper tag? That occurs when running again and there has
// not been another commit since the last tag.
const properTagExpr = /^v[^-]+(?:-pre-\d+)$/;
if (!gitDescribe.match(properTagExpr)) {
  // No, it is not the final form already - so calculate a pre-release version.

  // Retrieve the base version number
  const versionExpr = /^v([^-]+)/;
  const versionMatch = gitDescribe.match(versionExpr);
  if (!versionMatch) {
    // eslint-disable-next-line no-console
    console.error(`Unable to extract a base version number from ${gitDescribe}`);
    process.exit(1);
  }

  // Parse out the depth markers, and add them together
  const depthExpr = /-(\d+)-.{8}/gm;
  let depth = 0;
  [...gitDescribe.matchAll(depthExpr)].forEach((match) => {
    depth += Number.parseInt(match[1], 10);
  });

  // Build the new version string
  [version] = versionMatch;
  if (depth > 0) {
    version += `-pre-${depth.toString()}`;
  }
}

// eslint-disable-next-line no-console
console.info(version);

if (updatePackageJson) {
  callShellCommand(`npm version ${version} --allow-same-version --workspaces true`);
}

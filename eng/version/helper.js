// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const { execSync } = require('child_process');

/* Cases that this code must handle:
 * 1. Last tag was a release version and there have been no commits: then keep
 *    that tag. v0.3.0 --> v0.3.0
 * 2. Last tag was a release version and there have been some commits: then
 *    calculate depth and create a pre-release. v0.3.0-10-gbad82c2 ->
 *    v0.3.0-pre-10.
 * 3. Last tag was a pre-release version and there have been no commits: keep
 *    the tag. v0.3.0-pre-10 --> v0.3.0-pre-10.
 * 4. Last tag was a pre-release version and there have been no commits: get the
 *    new depth and add it to the prior depth. v0.3.0-pre-10-3-hcbd82c2 -->
 *    v0.3.0-pre-13.
 */
function calculateNextVersion(gitDescribe) {
  let version = gitDescribe;
  const properTagExpr = /^v[^-]+(?:-pre-\d+)$/;
  if (!gitDescribe.match(properTagExpr)) {
    // Parse out the components
    const versionExpr = /^(?<base>v[^-]+)((-pre-(?<pre>\d+))?-(?<depth>\d+)-.{8})?/;
    const versionMatch = gitDescribe.match(versionExpr);
    if (!versionMatch) {
      return null;
    }

    let { base, pre, depth } = versionMatch.groups;

    version = base;
    pre = pre ?? "0";
    depth = depth ?? "0";
    if (pre != "0" || depth != "0") {
      version = `${version}-pre-${Number.parseInt(pre, 10) + Number.parseInt(depth, 10)}`;
    }
  }

  return version;
}

function callShellCommand(cmd, options) {
  return execSync(cmd, options).toString().replace('\n', '');
}

module.exports = {
  calculateNextVersion,
  callShellCommand
};

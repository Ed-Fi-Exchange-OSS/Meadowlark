// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/*
 * Updates package.json to the specified version. NO COMMIT.
 */

const { callShellCommand } = require('./helper');

let version = process.argv[2];

if (!version) {
  console.error('Must specify an exact version number at the command line, like: node set.js v1.2.3-pre-4');
  process.exit(1);
}

if (version[0] == 'v') {
  version = version.substring(1);
}

callShellCommand(`npm version ${version} --allow-same-version --workspaces true --workspaces-update false`, { cwd: '../../Meadowlark-js'});

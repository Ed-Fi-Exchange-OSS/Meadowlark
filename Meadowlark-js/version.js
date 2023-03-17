// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// This code could easily be expressed in a shell script, but using Node makes it platform independent.

const { execSync } = require('child_process');

const callShellCommand = (cmd) => {
  // eslint-disable-next-line no-console
  console.info(`executing: ${cmd}`);
  return execSync(cmd).toString().replace('\n', '');
};

// `git describe` returns the last tag plus the commit depth and the short hash for the most recent commit
// Example: last tag was v1.0.0, there have been four more commits, and the most recent has hash abcdef. Then
// the output will be v1.0.0-4-abcdef
const version = callShellCommand('git describe --first-parent --tags');
callShellCommand(`npm version ${version} --allow-same-version --workspaces true`);

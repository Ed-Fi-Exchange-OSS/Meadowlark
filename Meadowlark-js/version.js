// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const { execSync } = require('child_process');

if (process.argv.length < 3) {
  console.error('Expected a command argument');
  process.exit(1);
}

const callShellCommand = (cmd) => {
  console.info(`executing: ${cmd}`);
  return execSync(cmd).toString().replace('\n', '');
}

const command = process.argv[2];

const validCommands = [
  'counter', 'prerelease', 'patch', 'minor', 'major'
]
if (!validCommands.includes(command)) {
  console.error(`Invalid command '${command}'. Choices are: ${validCommands.join(', ')}`);
  process.exit(2);
}

let version = command;
if (command == "counter") {
  // `git describe` returns the last tag plus the commit depth and the short hash for the most recent commit
  // Example: last tag was v1.0.0, there have been four more commits, and the most recent has hash abcdef. Then
  // the output will be v1.0.0-4-abcdef
  version = callShellCommand('git describe --first-parent');
}

let shellCommand = `npm version ${version} --allow-same-version --workspaces true`;
callShellCommand(shellCommand);

// According to npm documentation, we should be able to use `--sign-git-tag true` to cause the version command to commit,
// sign, and tag the changes. But these are broken in all versions through 9. https://github.com/npm/cli/issues/2010
if (process.argv[3] === "--commit") {
  callShellCommand('git add :/**/package.json');
  callShellCommand('git commit -S -m "Bump version"');
  callShellCommand(`git tag -s ${version} -m "Bump version"`);
}

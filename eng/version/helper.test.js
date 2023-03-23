// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const { calculateNextVersion } = require('./helper');

describe('given input from `git describe`', () => {
  describe('when calculating the next version', () => {
  it.each([
    ['v0.3.0','v0.3.0'],
    ['v0.3.0-10-gbad82c2','v0.3.0-pre-10'],
    ['v0.3.0-pre-10','v0.3.0-pre-10'],
    ['v0.3.0-pre-10-3-hcbd82c2','v0.3.0-pre-13']
  ])('builds a proper semantic version from %s', (gitDescribe, expected) => {
    expect(calculateNextVersion(gitDescribe)).toBe(expected);
  });});
});

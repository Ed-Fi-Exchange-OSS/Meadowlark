// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const signingKeyEncoded = process.env.SIGNING_KEY;
if (signingKeyEncoded == null) {
  throw new Error('Must have a base-64 encoded signing key. Try creating a new one with `yarn createKey`');
}
export const signingKey: Buffer = Buffer.from(signingKeyEncoded, 'base64');

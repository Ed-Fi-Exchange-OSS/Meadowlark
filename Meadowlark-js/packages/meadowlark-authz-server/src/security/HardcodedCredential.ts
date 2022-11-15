// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

type HardcodedCredential = {
  key: string;
  secret: string;
  vendor: string;
  role: string[];
};

export const admin1: HardcodedCredential = {
  key: 'meadowlark_admin_key_1',
  secret: 'meadowlark_admin_secret_1',
  vendor: '',
  role: ['admin'],
};

export const verifyOnly1: HardcodedCredential = {
  key: 'meadowlark_verify-only_key_1',
  secret: 'meadowlark_verify-only_secret_1',
  vendor: '',
  role: ['verify-only'],
};

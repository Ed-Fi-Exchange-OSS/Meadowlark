// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

type HardcodedCredential = {
  key: string;
  secret: string;
  vendor: string;
};

export const client1: HardcodedCredential = {
  key: 'meadowlark_key_1',
  secret: 'meadowlark_secret_1',
  vendor: 'super-great-SIS',
};

export const client2: HardcodedCredential = {
  key: 'meadowlark_key_2',
  secret: 'meadowlark_secret_2',
  vendor: 'small-town-sis',
};

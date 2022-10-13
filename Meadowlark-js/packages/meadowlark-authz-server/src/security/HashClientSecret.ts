// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export function hashClientSecretBuffer(clientSecretBytes: Buffer) {
  return crypto.createHash('shake256').update(clientSecretBytes).digest('hex');
}

export function hashClientSecretHexString(clientSecretHexString: string) {
  return hashClientSecretBuffer(Buffer.from(clientSecretHexString, 'hex'));
}

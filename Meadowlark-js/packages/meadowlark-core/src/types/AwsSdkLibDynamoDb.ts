// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// AWS SDK v3 does not include exported types for many DynamoDB sub-objects, so we define them ourselves here.
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

// Key/value pairs of TransactWriteCommandInput.TransactItems.Put.Item data
export type PutItemInputAttributeMap =
  | {
      [key: string]: NativeAttributeValue;
    }
  | undefined;

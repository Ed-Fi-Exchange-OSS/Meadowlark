// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// AWS SDK v3 does not include exported types for many DynamoDB sub-objects, so we define them ourselves here.
import { ConditionCheck, Delete, Put, TransactWriteItem as __TransactWriteItem, Update } from '@aws-sdk/client-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { MetadataBearer } from '@aws-sdk/types';

// Empty output object singleton to use in place of null
export const NoOutput: MetadataBearer = Object.freeze({ $metadata: {} });

// Key/value pairs of TransactWriteCommandInput.TransactItems.Put.Item data
export type PutItemInputAttributeMap =
  | {
      [key: string]: NativeAttributeValue;
    }
  | undefined;

// A single element in the array of TransactWriteCommandInput.TransactItems
export type TransactWriteItem = Omit<__TransactWriteItem, 'ConditionCheck' | 'Put' | 'Delete' | 'Update'> & {
  ConditionCheck?: Omit<ConditionCheck, 'Key' | 'ExpressionAttributeValues'> & {
    Key:
      | {
          [key: string]: NativeAttributeValue;
        }
      | undefined;
    ExpressionAttributeValues?: {
      [key: string]: NativeAttributeValue;
    };
  };
  Put?: Omit<Put, 'Item' | 'ExpressionAttributeValues'> & {
    Item: PutItemInputAttributeMap;
    ExpressionAttributeValues?: {
      [key: string]: NativeAttributeValue;
    };
  };
  Delete?: Omit<Delete, 'Key' | 'ExpressionAttributeValues'> & {
    Key:
      | {
          [key: string]: NativeAttributeValue;
        }
      | undefined;
    ExpressionAttributeValues?: {
      [key: string]: NativeAttributeValue;
    };
  };
  Update?: Omit<Update, 'Key' | 'ExpressionAttributeValues'> & {
    Key:
      | {
          [key: string]: NativeAttributeValue;
        }
      | undefined;
    ExpressionAttributeValues?: {
      [key: string]: NativeAttributeValue;
    };
  };
};

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { PutItemInputAttributeMap } from '../types/AwsSdkLibDynamoDb';

/*
 * TODO: This is very DynamoDB specific
 *
 * Foreign key reference information, extracted from an entity.
 */
export class ForeignKeyItem {
  /*
   * Key value of the entity
   */
  From: string;

  /*
   * Key value of the foreign key reference
   */
  To: string;

  /*
   * Unhashed key information for the entity
   */
  Description: {
    /*
     * Entity type
     */
    Type: string;

    /*
     * Entity natural key string
     */
    NaturalKey: string;
  };

  public constructor(init?: Partial<ForeignKeyItem>) {
    Object.assign(this, init);
  }

  generateFromToItem(): PutItemInputAttributeMap {
    return {
      pk: ForeignKeyItem.buildFromReferenceKey(this.From),
      sk: ForeignKeyItem.buildToReferenceKey(this.To),
    };
  }

  generateToFromItem(): PutItemInputAttributeMap {
    return {
      pk: ForeignKeyItem.buildToReferenceKey(this.To),
      sk: ForeignKeyItem.buildFromReferenceKey(this.From),
      info: this.Description,
    };
  }

  static buildFromReferenceKey(id: string): string {
    return `FREF#${id}`;
  }

  static buildToReferenceKey(id: string): string {
    return `TREF#${id}`;
  }
}

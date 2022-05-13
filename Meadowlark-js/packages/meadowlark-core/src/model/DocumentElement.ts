// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/**
 * An DocumentElement is a name/value pair taken from an Ed-Fi document that expresses part of
 * the document identity.
 *
 * For example in a Student document, studentUniqueId is a part of a Student
 * document's identity. { "studentUniqueId": "1" } in a specific Student document body
 * represents that part of the identity (in relational database terms, it would be part
 *  of the "natural key").
 */
export type DocumentElement = {
  /**
   * A document path name and value pair.
   */
  name: string;

  /**
   * The value taken from the document body.
   */
  value: string;
};

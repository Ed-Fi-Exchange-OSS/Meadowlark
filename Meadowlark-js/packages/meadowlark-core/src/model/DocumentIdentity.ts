// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentElement } from './DocumentElement';

/**
 * A DocumentIdentity is an array of DocumentElements that represents the complete identity
 * of an Ed-Fi document. In Ed-Fi documents, these are always a list of document elements
 * from the top level of the document (never nested in sub-objects, and never collections).
 *
 * This is an array because many documents have multiple values as part of their identity. The
 * array is always ordered by name ascending.
 */
export type DocumentIdentity = DocumentElement[];

/**
 * The null object for DocumentIdentity
 */
export const NoDocumentIdentity: DocumentIdentity = [];

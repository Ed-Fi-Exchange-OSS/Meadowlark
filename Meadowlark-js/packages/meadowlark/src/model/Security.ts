// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/**
 * A simple object representing the security information optionally included
 * in API request headers.
 */
export type Security = {
  // Original experimental security via edorgs, students, and associations
  edOrgIds: string[];
  studentIds: string[];
  throughAssociation?: string;

  // Security via document ownership
  isOwnershipEnabled: boolean;
  // Client name string pulled from JWT subject, or null if not available
  clientName: string | null;
};

export function newSecurity(): Security {
  return {
    edOrgIds: [],
    studentIds: [],
    throughAssociation: undefined,
    isOwnershipEnabled: false,
    clientName: null,
  };
}

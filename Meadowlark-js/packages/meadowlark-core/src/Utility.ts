// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export function decapitalize(str: string): string {
  if (str.length === 0) return str;
  if (str.length === 1) return str.toLowerCase();
  return str[0].toLowerCase() + str.slice(1);
}

/** Use in JSON.stringify. */
export function omitEmptyArrays(_: string, value: any): any {
  if (Array.isArray(value) && value.length === 0) {
    return undefined;
  }

  return value;
}

/** Creates a message structured similar to that provided by ASP.NET APIs */
export function createInvalidRequestResponse(modelState: { [key: string]: string[] }): object {
  return {
    error: 'The request is invalid.',
    modelState,
  };
}

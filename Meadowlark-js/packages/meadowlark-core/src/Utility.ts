// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

export function decapitalize(str: string): string {
  if (str.length === 0) return str;
  if (str.length === 1) return str.toLowerCase();
  return str[0].toLowerCase() + str.slice(1);
}

/** Returns a new object */
export function decapitalizeKeys(obj: object): object {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [decapitalize(key), value]));
}

/** Convert any non-array object value into an array of length 1. Mutates object */
export function arrayifyScalarObjectValues(obj: object): object {
  Object.keys(obj).forEach((key) => {
    if (!Array.isArray(obj[key])) {
      obj[key] = [obj[key]];
    }
  });
  return obj;
}

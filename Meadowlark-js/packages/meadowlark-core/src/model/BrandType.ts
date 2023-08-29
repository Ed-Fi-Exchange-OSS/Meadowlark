// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

// This is a generic "brand" type used to create branded types from strings
// Note this is a pure Typescript construct. The __brand property and usage of
// string literals for T do not exist after transpile.
export type Brand<K, T> = K & { __brand: T };

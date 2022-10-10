// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Logger } from '@edfi/meadowlark-core';
import { AuthorizationRequest } from './handler/AuthorizationRequest';

export function writeDebugStatusToLog(
  moduleName: string,
  request: AuthorizationRequest,
  method: string,
  status: number,
  message: string = '',
): void {
  Logger.debug(`${moduleName}.${method} ${status} ${message || ''}`.trimEnd(), request.traceId);
}

export function writeErrorToLog(moduleName: string, traceId: string, method: string, status: number, error?: any): void {
  Logger.error(`${moduleName}.${method} ${status}`, traceId, error);
}

export function writeRequestToLog(moduleName: string, request: AuthorizationRequest, method: string): void {
  Logger.info(`${moduleName}.${method} ${request.path}`, request.traceId, request);
}

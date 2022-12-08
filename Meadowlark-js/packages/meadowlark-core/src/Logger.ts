// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { isDebugEnabled, isInfoEnabled, Logger, writeErrorToLog as logError } from '@edfi/meadowlark-utilities';

import { FrontendRequest } from './handler/FrontendRequest';

export function writeDebugStatusToLog(
  moduleName: string,
  request: FrontendRequest,
  method: string,
  status: number | undefined = undefined,
  message: string = '',
): void {
  if (isDebugEnabled()) {
    Logger.debug(`${moduleName}.${method} ${status || ''} ${message || ''}`.trimEnd(), request.traceId);
  }
}

export function writeRequestToLog(moduleName: string, request: FrontendRequest, method: string): void {
  if (isInfoEnabled()) {
    Logger.info(`${moduleName}.${method} ${request.path}`, request.traceId);
  }
}

export function writeErrorToLog(moduleName: string, traceId: string, functionName: string, error: any): void {
  logError(moduleName, traceId, functionName, undefined, error);
}

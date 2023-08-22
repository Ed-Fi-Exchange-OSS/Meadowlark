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
  statusCode?: number,
  message?: string,
  extra?: any,
): void {
  if (isDebugEnabled()) {
    Logger.debug(`${moduleName}.${method} ${statusCode ?? ''} ${message ?? ''}`.trimEnd(), request.traceId, extra);
  }
}

export function writeDebugObject(
  moduleName: string,
  request: FrontendRequest,
  method: string,
  statusCode?: number,
  messageBody?: object,
): void {
  Logger.debug(`${moduleName}.${method} ${statusCode}`, request.traceId, messageBody);
}

export function writeDebugMessage(moduleName: string, request: FrontendRequest, method: string, message: string): void {
  Logger.debug(`${moduleName}.${method}`, request.traceId, message);
}

export function writeRequestToLog(moduleName: string, request: FrontendRequest, method: string, extra?: any): void {
  if (isInfoEnabled()) {
    Logger.info(`${moduleName}.${method} ${request.path}`, request.traceId, extra);
  }
}

export function writeErrorToLog(moduleName: string, traceId: string, functionName: string, error: any): void {
  logError(moduleName, traceId, functionName, undefined, error);
}

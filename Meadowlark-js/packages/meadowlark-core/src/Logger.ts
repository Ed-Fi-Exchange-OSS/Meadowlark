// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import winston from 'winston';
import { FrontendRequest } from './handler/FrontendRequest';

const offline = process.env.IS_LOCAL === 'true';

const format = winston.format.combine(
  winston.format.label({
    label: 'Meadowlark',
  }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:SS',
  }),
  winston.format.json(),
);

const offlineFormat = winston.format.combine(
  winston.format.cli(),
  winston.format.colorize({
    all: true,
  }),
);

// Logger begins life "uninitialized" and in silent mode
let isInitialized = false;

// Create and set up a silent default logger transport - in case a library is using the default logger
const transport = new winston.transports.Console();
transport.silent = true;
winston.configure({ transports: [transport] });

// Set initial logger to silent
let logger: winston.Logger = winston.createLogger({
  transports: [transport],
});

/**
 * This should be called by frontend services at startup, before logging. Because services can have
 * multiple startup points (e.g. multiple lambdas), this checks if initialization has already happened.
 */
export function initializeLogging(): void {
  if (isInitialized) return;

  isInitialized = true;
  logger = winston.createLogger({
    level: process.env.LOG_LEVEL?.toLocaleLowerCase() || (offline ? 'debug' : 'info'),
    transports: [
      new winston.transports.Console({
        format: offline ? offlineFormat : format,
      }),
    ],
  });
}

export const Logger = {
  error: (message: string, traceId: string | null, err?: any | null) => {
    let error: object;

    // Preserve any dictionary, but otherwise convert to string
    if (err != null && err.constructor !== Object) {
      error = err.toString();
    } else {
      error = err;
    }

    logger.error({ message, error, traceId });
  },
  warn: (message: string, traceId: string | null) => {
    logger.warn({ message, traceId });
  },
  info: (message: string, traceId: string | null, extra?: any | null) => {
    logger.info({ message, traceId, extra });
  },
  debug: (message: string, traceId: string | null, extra?: any | null) => {
    logger.debug({ message, traceId, extra });
  },
};

export function writeRequestToLog(moduleName: string, request: FrontendRequest, method: string): void {
  Logger.info(`${moduleName}.${method} ${request.path}`, request.traceId, request);
}

export function writeDebugStatusToLog(
  moduleName: string,
  request: FrontendRequest,
  method: string,
  status: number,
  message: string = '',
): void {
  Logger.debug(`${moduleName}.${method} ${status} ${message || ''}`.trimEnd(), request.traceId);
}

export function writeErrorToLog(moduleName: string, traceId: string, method: string, status: number, error?: any): void {
  Logger.error(`${moduleName}.${method} ${status}`, traceId, error);
}

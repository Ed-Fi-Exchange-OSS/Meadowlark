// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';
import * as Config from './Config';

/*
 * Function to remove sensitive from mongoDb connection string.
 */
function removeSensitiveDataFromMongoDbConnection(message: string): string {
  const patternToProtect = /mongodb:\/\/[\w!@#$%^&*)(+=.-]+:[\w!@#$%^&*)(+=.-]+@/gis;
  const safeReplacementText = 'mongodb://*****:*****@';
  return message.replace(patternToProtect, safeReplacementText);
}
/*
 * Function to remove any sensitive information from the message being logged
 */
function removeSensitiveData(message: string): string {
  let messageToProtect: string;
  if (message === undefined) {
    return message;
  }
  if (typeof message === 'object') {
    messageToProtect = JSON.stringify(message);
  } else {
    messageToProtect = message;
  }
  return removeSensitiveDataFromMongoDbConnection(messageToProtect);
}

const convertErrorToString = (err) => {
  // Preserve any dictionary, but otherwise convert to string
  if (err != null && err.constructor !== Object) {
    return err.toString();
  }
  return err;
};

// The pino logger
let logger: PinoLogger = pino({ level: 'silent' });

// Logger begins life "uninitialized" and in silent mode
let isInitialized = false;

/**
 * This should be called by frontend services at startup, before logging. Because services can have
 * multiple startup points (e.g. multiple lambdas), this checks if initialization has already happened.
 *
 * Note that writing logs to STDOUT is slower than writing to a file, and pretty-printing with LOG_PRETTY_PRINT
 * is slower than not.
 */
export function initializeLogging(): void {
  if (isInitialized) return;
  isInitialized = true;

  const targets: any[] = [];
  if (Config.get<boolean>('LOG_TO_FILE')) {
    if (Config.get<boolean>('LOG_PRETTY_PRINT')) {
      targets.push({
        target: 'pino-pretty',
        options: {
          colorize: true,
          colorizeObjects: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          destination: `${Config.get('LOG_FILE_LOCATION')}/meadowlark.log`,
          mkdir: true,
        },
      });
    } else {
      targets.push({
        target: 'pino/file',
        options: {
          destination: `${Config.get('LOG_FILE_LOCATION')}/meadowlark.log`,
          mkdir: true,
        },
      });
    }
  } else if (Config.get<boolean>('LOG_PRETTY_PRINT')) {
    // pretty-printed to STDOUT
    targets.push({
      target: 'pino-pretty',
      options: {
        colorize: true,
        colorizeObjects: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss.l',
      },
    });
  } else {
    // STDOUT
    targets.push({
      target: 'pino/file',
    });
  }

  logger = pino({
    name: 'Meadowlark',
    level: Config.get<string>('LOG_LEVEL').toLocaleLowerCase(),
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: {
      targets,
    },
  });
}

export function isDebugEnabled(): boolean {
  return logger.isLevelEnabled('debug');
}

export function isInfoEnabled(): boolean {
  return logger.isLevelEnabled('info');
}

export const Logger = {
  // This object is tuned for use in many situations without further customization. For example, it can be used directly in
  // Fastify, so long as it continues to have definitions for: fatal, error, warn, info, debug, trace, child.

  fatal: (message: string, err?: any | null) => {
    logger.error({ message: removeSensitiveData(message), err: convertErrorToString(err) });
    process.exit(1);
  },
  error: (message: string, traceId: string | null, err?: any | null) => {
    logger.error({ message: removeSensitiveData(message), error: convertErrorToString(err), traceId });
  },
  warn: (message: string, traceId: string | null) => {
    logger.warn({ message: removeSensitiveData(message), traceId });
  },
  info: (message: string, traceId: string | null, extra?: any | null) => {
    if (isInfoEnabled()) {
      logger.info({ message: removeSensitiveData(message), traceId, extra });
    }
  },
  debug: (message: string, traceId: string | null, extra?: any | null) => {
    if (isDebugEnabled()) {
      logger.debug({ message: removeSensitiveData(message), traceId, extra });
    }
  },
  trace: (message: string) => {
    logger.debug({ message: JSON.stringify(message) });
  },
  child: () => Logger,
};

export function writeErrorToLog(
  moduleName: string,
  traceId: string,
  method: string,
  status?: number | undefined,
  error?: any,
): void {
  Logger.error(`${moduleName}.${method} ${status || ''}`, traceId, error);
}

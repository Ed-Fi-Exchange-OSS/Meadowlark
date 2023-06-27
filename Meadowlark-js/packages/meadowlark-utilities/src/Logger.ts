// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import winston from 'winston';
import * as Config from './Config';

const timestampFormat: string = 'YYYY-MM-DD HH:mm:ss.SSS';

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

const format = winston.format.combine(
  winston.format.label({
    label: 'Meadowlark',
  }),
  winston.format.timestamp({
    format: timestampFormat,
  }),
  winston.format.json(),
);

const offlineFormat = winston.format.combine(
  winston.format.timestamp({
    format: timestampFormat,
  }),
  winston.format.printf(({ level, message, timestamp, traceId, extra, error }) => {
    let m = message;
    let e = error ?? extra ?? '';
    const t = traceId ?? 'not-applicable';

    if (typeof message === 'object') {
      // TypeScript thinks that this is a string, but it there are cases where it ends up being an object
      m = convertErrorToString(m);
    }
    if (typeof e === 'object') {
      e = JSON.stringify(e);
    }

    return `${timestamp} ${level} ${t} ${m} ${e}`;
  }),
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

  const offline = Config.get('IS_LOCAL') === true;
  isInitialized = true;
  logger = winston.createLogger({
    level: Config.get<string>('LOG_LEVEL').toLocaleLowerCase(),
    transports: [
      new winston.transports.Console({
        format: offline ? offlineFormat : format,
      }),
    ],
  });

  if (Config.get('SAVE_LOG_TO_FILE') === true) {
    logger.add(
      new winston.transports.File({
        dirname: Config.get('LOG_FILE_LOCATION'),
        filename: 'meadowlark.log',
      }),
    );
  }
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
    logger.info({ message: removeSensitiveData(message), traceId, extra });
  },
  debug: (message: string, traceId: string | null, extra?: any | null) => {
    logger.debug({ message: removeSensitiveData(message), traceId, extra });
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

export function isDebugEnabled(): boolean {
  return logger.levels[logger.level] >= logger.levels.debug;
}

export function isInfoEnabled(): boolean {
  return logger.levels[logger.level] >= logger.levels.info;
}

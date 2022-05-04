// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable-next-line import/no-unresolved */
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import winston from 'winston';

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
  format,
  winston.format.colorize({
    all: true,
  }),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL?.toLocaleLowerCase() || (offline ? 'debug' : 'info'),
  transports: [
    new winston.transports.Console({
      format: offline ? offlineFormat : format,
    }),
  ],
});

export const Logger = {
  error: (message: string, lambdaRequestId: string | null, apiGatewayRequestId?: string | null, err?: any | null) => {
    let error: object;

    // Preserve any dictionary, but otherwise convert to string
    if (err != null && err.constructor !== Object) {
      error = err.toString();
    } else {
      error = err;
    }

    logger.error({ message, error, lambdaRequestId, apiGatewayRequestId });
  },
  warn: (message: string, lambdaRequestId: string | null, apiGatewayRequestId?: string | null) => {
    logger.warn({ message, lambdaRequestId, apiGatewayRequestId });
  },
  info: (message: string, lambdaRequestId: string | null, apiGatewayRequestId?: string | null, extra?: any | null) => {
    logger.info({ message, lambdaRequestId, apiGatewayRequestId, extra });
  },
  debug: (message: string, lambdaRequestId: string | null, apiGatewayRequestId?: string | null, extra?: any | null) => {
    logger.debug({ message, lambdaRequestId, apiGatewayRequestId, extra });
  },
};

export function writeRequestToLog(moduleName: string, event: APIGatewayProxyEvent, context: Context, method: string): void {
  Logger.info(`${moduleName}.${method} ${event.path}`, context.awsRequestId, event.requestContext.requestId, event.headers);
}

export function writeDebugStatusToLog(
  moduleName: string,
  context: Context,
  method: string,
  status: number,
  message: string = '',
): void {
  Logger.debug(`${moduleName}.${method} ${status} ${message || ''}`.trimEnd(), context.awsRequestId);
}

export function writeErrorToLog(
  moduleName: string,
  context: Context,
  event: APIGatewayProxyEvent,
  method: string,
  status: number,
  error?: any,
): void {
  Logger.error(`${moduleName}.${method} ${status}`, context.awsRequestId, event.requestContext.requestId, error);
}

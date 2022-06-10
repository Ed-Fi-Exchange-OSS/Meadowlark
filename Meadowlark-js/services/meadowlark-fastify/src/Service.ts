// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/* eslint-disable no-use-before-define */

import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import FastifyRateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { Logger } from '@edfi/meadowlark-core';
import { deleteIt, get, update, upsert } from './handler/CrudHandler';
import {
  metaed,
  apiVersion,
  swaggerForResourcesAPI,
  swaggerForDescriptorsAPI,
  openApiUrlList,
  dependencies,
} from './handler/MetadataHandler';
import { oauthHandler } from './handler/OAuthHandler';

export function buildService(): FastifyInstance {
  const service = Fastify({
    logger: logWrapper(),
    disableRequestLogging: true,
    genReqId: () => randomUUID(),
  });

  customizeRequestLogging();

  if (process.env.FASTIFY_RATE_LIMIT == null || process.env.FASTIFY_RATE_LIMIT.toLowerCase() === 'true') {
    // Add rate limiter, taking the defaults. Note this uses an in-memory store by default, better multi-server
    // effectiveness requires configuring for redis or an alternative store
    service.register(FastifyRateLimit);
  }

  // override json parser to leave body as string
  service.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    done(null, body);
  });

  const stage: string = process.env.MEADOWLARK_STAGE || 'local';

  // Matching crud operations handlers
  service.get(`/${stage}/*`, get);
  service.post(`/${stage}/*`, upsert);
  service.put(`/${stage}/*`, update);
  service.delete(`/${stage}/*`, deleteIt);

  // MetaEd metadata handler
  service.get(`/${stage}/metaed`, metaed);

  // API version handler
  service.get(`/${stage}`, apiVersion);
  service.get(`/${stage}/`, apiVersion);

  // Swagger handlers
  service.get(`/${stage}/metadata`, openApiUrlList);
  service.get(`/${stage}/metadata/`, openApiUrlList);
  service.get(`/${stage}/metadata/resources/swagger.json`, swaggerForResourcesAPI);
  service.get(`/${stage}/metadata/descriptors/swagger.json`, swaggerForDescriptorsAPI);
  service.get(`/${stage}/metadata/data/v3/dependencies`, dependencies);

  // OAuth handlers
  service.post(`/${stage}/api/oauth/token`, oauthHandler);
  service.get(`/${stage}/createKey`, oauthHandler);
  service.get(`/${stage}/verify`, oauthHandler);

  return service;

  function logWrapper(): FastifyLoggerInstance {
    return {
      info: (msg: string) => Logger.info(msg, null),
      warn: (msg: string) => Logger.warn(msg, null),
      error: (msg: string) => Logger.error(msg, null),
      fatal: (msg: string) => Logger.error(msg, null),
      trace: (msg: string) => Logger.debug(msg, null),
      debug: (msg: string) => Logger.debug(msg, null),
      child: (_) => logWrapper(),
    };
  }

  function customizeRequestLogging() {
    // Customize the request logging so that request Id and extra info can be passed into the Meadowlark logger.
    function now() {
      return Date.now();
    }

    service.addHook('onRequest', (req, reply, done) => {
      // eslint-disable-next-line dot-notation
      reply.headers['startTime'] = now();
      Logger.info('Request', req.id, { url: req.raw.url, contentType: req.headers['content-type'] });
      done();
    });

    service.addHook('onResponse', (req, reply, done) => {
      Logger.info('Response', req.id, {
        url: req.raw.url,
        statusCode: reply.raw.statusCode,
        // eslint-disable-next-line dot-notation
        durationMs: now() - Number(reply.headers['startTime']),
      });
      done();
    });
  }
}

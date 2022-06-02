// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  update as meadowlarkUpdate,
  upsert as meadowlarkUpsert,
  get as meadowlarkGet,
  deleteIt as meadowlarkDelete,
} from '@edfi/meadowlark-core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { respondWith, fromRequest } from './MeadowlarkConverter';

/**
 * Entry point for API POST requests
 */
export async function upsert(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await meadowlarkUpsert(fromRequest(request)), reply);
}

/**
 * Entry point for all API GET requests
 */
export async function get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await meadowlarkGet(fromRequest(request)), reply);
}

/**
 * Entry point for all API PUT requests, which are "by id"
 */
export async function update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await meadowlarkUpdate(fromRequest(request)), reply);
}

/**
 * Entry point for all API DELETE requests, which are "by id"
 */
export async function deleteIt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await meadowlarkDelete(fromRequest(request)), reply);
}

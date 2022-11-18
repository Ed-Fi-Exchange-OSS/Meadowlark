// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import {
  createClient,
  createSigningKey,
  getClientById,
  requestToken,
  resetAuthorizationClientSecret,
  updateClient,
  verifyToken,
} from '@edfi/meadowlark-authz-server';
import { FastifyReply, FastifyRequest } from 'fastify';
import { respondWith, fromRequest } from './AuthorizationConverter';

export async function createAuthorizationClientHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await createClient(fromRequest(request)), reply);
}

export async function updateAuthorizationClientHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await updateClient(fromRequest(request)), reply);
}

export async function requestTokenAuthorizationHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await requestToken(fromRequest(request)), reply);
}

export async function verifyTokenAuthorizationHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await verifyToken(fromRequest(request)), reply);
}

export async function resetAuthorizationClientSecretHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await resetAuthorizationClientSecret(fromRequest(request)), reply);
}

export async function createSigningKeyHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await createSigningKey(fromRequest(request)), reply);
}

export async function getClientByIdHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await getClientById(fromRequest(request)), reply);
}

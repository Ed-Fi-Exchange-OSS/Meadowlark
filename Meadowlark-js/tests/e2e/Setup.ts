// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const request = require('supertest');
const path = require('path');
const dotenv = require('dotenv');
const Chance = require('chance');

const credentialManager = require('./helpers/Credentials');

dotenv.config({ path: path.join(__dirname, './.env') });

export const chance = new Chance();

export const baseURLRequest = request(process.env.BASE_URL);
export const rootURLRequest = request(process.env.ROOT_URL);

async function createAdminClient() {
  return baseURLRequest
    .post(`/oauth/client`)
    .send({
      clientName: 'Admin Client',
      roles: ['admin'],
    })
    .then((response) => {
      if (response.status !== 201) {
        return Promise.reject(new Error('Client already exists. Contact administrator for key and secret'));
      }

      return {
        key: response.body.client_id,
        secret: response.body.client_secret,
      };
    });
}

async function getToken(): Promise<void> {
  if (!process.env.ADMIN_KEY && !process.env.ADMIN_SECRET) {
    const credentials = await createAdminClient();
    await credentialManager.setCredentials(credentials);
  }

  try {
    await credentialManager.getAccessToken();
  } catch (error) {
    throw new Error(`Unable to generate token for admin user. ${error}`);
  }
}

module.exports = async () => getToken();

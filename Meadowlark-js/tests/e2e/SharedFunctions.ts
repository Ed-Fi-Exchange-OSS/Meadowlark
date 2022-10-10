// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import path from 'path';
import dotenv from 'dotenv';
import request from "supertest";

dotenv.config({path: path.join(__dirname, "./.env")});

export const baseURLRequest = request(process.env.BASE_URL);
export const rootURLRequest = request(process.env.ROOT_URL);

export let accessToken: string;

beforeAll(async () => {
  accessToken = await getAccessToken();
});

async function getAccessToken(): Promise<string> {
  if (!accessToken) {
    accessToken = await baseURLRequest
      .post('/api/oauth/token')
      .send({
        "grant_type": "client_credentials",
        "client_id": process.env.CLIENT_ID,
        "client_secret": process.env.CLIENT_SECRET
      })
      .then(response => response.body.access_token);
  }
  return accessToken;
}

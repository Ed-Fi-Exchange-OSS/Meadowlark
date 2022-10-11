// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import path from 'path';
import dotenv from 'dotenv';
import request from "supertest";
import Chance from "chance";

// Setup
const chance = new Chance() as Chance.Chance;
dotenv.config({path: path.join(__dirname, "./.env")});

interface Credentials {
  key: string | undefined;
  secret: string | undefined;
}

export const baseURLRequest = request(process.env.BASE_URL);
export const rootURLRequest = request(process.env.ROOT_URL);

export let accessTokens: Array<{client: string; token: string;}> = [];

function getCredentials(client: string) {
  let credentials: Credentials;
  switch (client) {
    case "client4":
      credentials = {
        key: process.env.CLIENT_KEY_4,
        secret: process.env.CLIENT_SECRET_4
      }
      break;

    case "client1":
    default:
      credentials = {
        key: process.env.CLIENT_KEY_1,
        secret: process.env.CLIENT_SECRET_1
      }
      break;
  }

  return credentials;
}

export async function getAccessToken(client = "client1"): Promise<string> {
  let credentials = getCredentials(client);

  let token: string = accessTokens.find(t => t.client === client)?.token ?? "";
  if (!token) {
    console.log("No token. Generating");

    token = await baseURLRequest
      .post('/api/oauth/token')
      .send({
        "grant_type": "client_credentials",
        "client_id": credentials.key,
        "client_secret": credentials.secret
      })
      .then(response => response.body.access_token);

    accessTokens.push({client, token});
  }

  return token;
}

export function generateRandomId(length = 12): string {
  return chance.hash({length});
}

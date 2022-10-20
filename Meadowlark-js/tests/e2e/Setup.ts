// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import request from 'supertest';
import path from 'path';
import dotenv from 'dotenv';
import Chance from 'chance';

// Setup
export const chance = new Chance() as Chance.Chance;
dotenv.config({ path: path.join(__dirname, './.env') });

export const baseURLRequest = request(process.env.BASE_URL);
export const rootURLRequest = request(process.env.ROOT_URL);

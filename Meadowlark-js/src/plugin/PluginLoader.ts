// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
/* eslint-disable global-require */
import dotenv from 'dotenv';
import { MeadowlarkBackendPlugin } from './backend/MeadowlarkBackendPlugin';

dotenv.config();

export const backendPlugin: MeadowlarkBackendPlugin =
  require(`../packages/${process.env.BACKEND_PLUGIN_MODULE}/index`).initializeBackendPlugin();

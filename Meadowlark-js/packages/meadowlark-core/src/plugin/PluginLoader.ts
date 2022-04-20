// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
/* eslint-disable global-require */
import dotenv from 'dotenv';
import { MeadowlarkBackendPlugin } from './backend/MeadowlarkBackendPlugin';
import { NoMeadowlarkBackendPlugin } from './backend/NoMeadowlarkBackendPlugin';

dotenv.config();

const loadedBackendPlugin = process.env.BACKEND_PLUGIN_MODULE
  ? require(`../packages/${process.env.BACKEND_PLUGIN_MODULE}/index`).initializeBackendPlugin()
  : NoMeadowlarkBackendPlugin;

export function backendPlugin(): MeadowlarkBackendPlugin {
  return loadedBackendPlugin;
}

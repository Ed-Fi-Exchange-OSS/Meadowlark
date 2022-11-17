// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

const path = require('path');
const dotenv = require('dotenv');

const credentialManager = require('./helpers/Credentials');

dotenv.config({ path: path.join(__dirname, './.env') });

module.exports = async () => {
  await credentialManager.authenticateAdmin();
  await credentialManager.createAutomationUsers();
};

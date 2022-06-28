// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

/**
 * An opaque state object provided by systemTestSetup that must be given to systemTestTeardown
 */
export type SystemTestClient = any;

/**
 * A plugin that exports setup and teardown functions to set and reset e.g. datastore state
 */
export interface SystemTestablePlugin {
  systemTestSetup: () => Promise<SystemTestClient>;
  systemTestTeardown: (client: SystemTestClient) => Promise<void>;
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Network } from 'testcontainers';
import * as ApiContainer from './containers/ApiContainer';
import * as MongoContainer from './containers/MongoContainer';
import * as OpenSearchContainer from './containers/OpenSearchContainer';
import { endLog } from './LogConfig';

export async function stop() {
  endLog();
  console.info('-- Tearing down environment --');
  await Promise.all([MongoContainer.stop(), ApiContainer.stop(), OpenSearchContainer.stop()]);
}

export async function configure() {
  const network = await new Network().start();
  await Promise.all([MongoContainer.setup(network), ApiContainer.setup(network), OpenSearchContainer.setup(network)]);

  console.debug('-- Environment Ready --');
}

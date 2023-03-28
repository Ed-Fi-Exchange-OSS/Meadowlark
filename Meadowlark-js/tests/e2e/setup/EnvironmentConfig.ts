// SPDX-License-Identifier: Apache-2.0

import { Network } from 'testcontainers';
import * as ApiContainer from './containers/apiContainer';
import * as MongoContainer from './containers/mongoContainer';
import * as OpenSearchContainer from './containers/openSearchContainer';
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

// SPDX-License-Identifier: Apache-2.0

import { Network, StartedDockerComposeEnvironment } from 'testcontainers';
import { setupAPIContainer } from './containers/apiContainer';
import { setupMongoContainer } from './containers/mongoContainer';
import { setupOpenSearchContainer } from './containers/openSearchContainer';
import { endLog } from './LogConfig';

let environment: StartedDockerComposeEnvironment;

export async function stop() {
  endLog();
  console.info('-- Tearing down environment --');
  await environment.stop();
  await environment.down();
}

export async function configure() {
  const network = await new Network().start();
  await setupMongoContainer(network);

  await setupAPIContainer(network);

  await setupOpenSearchContainer(network);

  console.debug('-- Environment Ready --');
}

// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MongoDBContainer } from '@testcontainers/mongodb';
import { StartedNetwork, StartedTestContainer } from 'testcontainers';
import { setMongoLog } from '../LogConfig';

let startedContainer: StartedTestContainer;

export async function setup(network: StartedNetwork) {
  try {
    const container = new MongoDBContainer(
      'mongo:6.0@sha256:f462722e606fe097ad00c0d39f97680ee050b90df43e1484543c2a31cb61b039',
    )
      .withNetwork(network)
      .withNetworkAliases('mongo-t1')
      .withName('mongo-test')
      .withReuse()
      .withCommand([
        '/usr/bin/mongod',
        '--bind_ip_all',
        '--journal',
        '--dbpath',
        '/data/db',
        '--enableMajorityReadConcern',
        'true',
      ])
      .withStartupTimeout(120_000);

    startedContainer = await container.start();
  } catch (error) {
    throw new Error(`\nUnexpected error setting up mongo container:\n${error}`);
  }

  await setMongoLog(startedContainer);
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}

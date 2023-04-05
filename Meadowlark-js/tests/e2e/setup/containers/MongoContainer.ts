// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MongoDBContainer, StartedNetwork, StartedTestContainer } from 'testcontainers';
import { setMongoLog } from '../LogConfig';

let startedContainer: StartedTestContainer;

export async function setup(network: StartedNetwork) {
  try {
    const container = new MongoDBContainer(
      'mongo:4.0.28@sha256:f68f07e0c0ee86b1d848a30b27e5573e9c960748a02f7c288e28282297117644',
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
      ]);

    startedContainer = await container.start();
  } catch (error) {
    throw new Error(`\nUnexpected error setting up mongo container:\n${error}`);
  }

  await setMongoLog(startedContainer);
}

export async function stop(): Promise<void> {
  await startedContainer.stop();
}

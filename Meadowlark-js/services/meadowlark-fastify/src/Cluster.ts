// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import cluster from 'cluster';
import os from 'os';
import { Logger } from '@edfi/meadowlark-utilities';
import { ServiceFactory } from './Factory';

const CPUS = os.cpus().length;

export class ClusterService {
  // eslint-disable-next-line no-useless-constructor, no-empty-function
  constructor(private readonly serviceFactory: ServiceFactory) {}

  /** Run in multi-threaded mode */
  run() {
    if (cluster.isPrimary) {
      this.master();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.worker();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  master() {
    Logger.debug(`Total Number of Cores: ${CPUS}`, null);
    Logger.debug(`Master ${process.pid} is running`, null);

    // Fork workers
    for (let i = 0; i < CPUS; i += 1) {
      const fork = cluster.fork();
      fork.send(i);
    }

    cluster.on('online', (worker) => {
      Logger.debug(`Worker ${worker.process.pid} is listening`, null);
    });

    cluster.on('exit', (worker) => {
      Logger.debug(`Worker ${worker.process.pid} died`, null);
    });
  }

  async worker() {
    const cb = (index: number) => {
      // Unregister immediately current listener for message
      process.off('message', cb);

      // Run application
      Logger.debug(`Worker ${process.pid} started`, null);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.serviceFactory(index);
    };

    process.on('message', cb);
  }
}

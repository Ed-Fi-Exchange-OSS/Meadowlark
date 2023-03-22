// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { resolve } from 'path';
import { GenericContainer } from 'testcontainers';

export async function setupAPIContainer() {
  let apiContainer: GenericContainer;

  console.time('API Image Setup');
  if (process.env.USE_EXISTING_API_IMAGE) {
    console.info('Skipping image generation. Build image locally (npm run docker:build) or pull from Docker Hub');
    apiContainer = new GenericContainer(process.env.API_IMAGE_NAME ?? 'meadowlark');
  } else {
    // This is not working on this version since there's no way to define a name for the built image
    console.info('Building image');
    apiContainer = await GenericContainer.fromDockerfile(resolve(process.cwd())).build();
  }
  console.timeEnd('API Image Setup');

  console.info(`Image: ${apiContainer.image} Ready`);
}

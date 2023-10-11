# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

# This file builds a Meadowlark Ed-Fi API from source code.

FROM node:18.18.0-bullseye-slim@sha256:9027d0d778368a3091ee36b0bfdc98ebf3d7815ee4e2811b05cc40ec2a0adf4e as base 
RUN apt-get update && \
  apt-get upgrade -y && \
  # dumb-init is useful for running node properly (not as PID 1)
  apt-get install -y --no-install-recommends dumb-init=1.2.5-1 && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* && \
  # create meadowlark.log file and give permissions to allow winston to write if enabled
  touch /var/log/meadowlark.log && \
  chown node /var/log/meadowlark.log && \ 
  chmod 600 /var/log/meadowlark.log

# Start a new layer so that we don't need to rebuild everything above
FROM base AS build
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"
WORKDIR /app

# Load all packages into Docker
COPY . ./

# Build the solution
RUN npm run docker:install && \
  npm run build

# Start from the node base image, copy all js files, and run Fastify
FROM base AS prod
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"
WORKDIR /app

# TODO: only copy js files, ideally use webpack to minimize file size
# and optimize-away the node_modules directories.
COPY --chown=node:node --from=build /app .

EXPOSE 3000
ENV NODE_ENV production
USER node

# Uncomment the next line if you need to create an image for manual debugging,
# i.e. to find why the build is failing.
# CMD ["tail -F /dev/null"]
CMD ["dumb-init", "node", "/app/services/meadowlark-fastify/dist/index.js"]
# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

FROM node:16.17.0-bullseye-slim@sha256:fa84c820c0a1106e170137241a66583f80c899d9b4483e4d2d8a1a9e413c2978 as base 
RUN apt-get update && apt-get upgrade -y

RUN apt-get update && \
    # dumb-init is useful for running node properly (not as PID 1)
    apt-get install -y --no-install-recommends dumb-init

# Start a new layer so that we don't need to rebuild everything above
FROM base as build
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"
WORKDIR /app

# Load all packages into Docker
COPY . ./

# Build the solution
RUN npm run docker:install
RUN npm run build

# need to worry about .env file...
# will want to remove all src, leaving only the dist files and node_modules
# ideally will want to bundle/consolidate all of that with webpack

# Start from the node base image, copy all js files, and run Fastify
FROM base as prod
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"
WORKDIR /app

COPY --chown=node:node --from=build /app .

EXPOSE 3000
ENV NODE_ENV production
USER node

# Uncomment the next line if you need to create an image for manual debugging,
# i.e. to find why the build is failing.
# CMD ["tail -F /dev/null"]
CMD ["dumb-init", "node", "/app/services/meadowlark-fastify/dist/index.js"]
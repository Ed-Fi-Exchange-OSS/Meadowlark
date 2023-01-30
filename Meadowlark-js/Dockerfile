# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

FROM node:16.17.0-bullseye-slim@sha256:fa84c820c0a1106e170137241a66583f80c899d9b4483e4d2d8a1a9e413c2978 as base 

# Install minimal development tools
RUN npm i lerna tsc -g

# Start a new layer so that we don't need to rebuild everything above
FROM base as build
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"
WORKDIR /app

# Load all packages into Docker
COPY . ./

# Build the solution
RUN npm ci --only=production
RUN npm run build

# Cleanup development tools
RUN npm rm lerna tsc -g

# need to worry about .env file...
# will want to remove all src, leaving only the dist files and node_modules
# ideally will want to bundle/consolidate all of that with webpack

# Start from the node base image, copy all js files, and run Fastify
FROM base as prod
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"
WORKDIR /app

COPY --from=build --chown=node:node /app/**/dist/**/*.js .
EXPOSE 3000
ENV NODE_ENV production
USER node
CMD "npm run start:local"

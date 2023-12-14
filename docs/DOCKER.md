# Using Docker with Meadowlark

The Meadowlark project uses [Docker Containers](https://www.docker.com)
extensively for development, testing, and eventually for production
environments. This repository contains a number of different docker-compose
files and readmes; this document is a first point of entry for all of the other
work.

## Local Development

As a developer working on Meadowlark, one needs to have running instances of
several backend services†; the easiest way to run those services is through
Docker († including: MongoDB, PostgreSQL, OpenSearch, Debezium Connect, Kafka,
and dashboards for OpenSearch and Kafka).

For more details on how to run these services for active development work, see
[DOCKER-LOCAL-DEV](DOCKER-LOCAL-DEV.md).

## Integration and End-to-End Testing

Each backend has a small set of integration tests, that run the repository
modules against a live instance of the backend data store. For MongoDB we are
able to use an in-memory instance. For PostgreSQL and OpenSearch, we automate
startup of containers using [TestContainers](https://testcontainers.com/). The
developer does not need to do anything at runtime to make this work, other than
follow the one-time "Global Docker Configuration" steps in
[DOCKER-LOCAL-DEV](DOCKER-LOCAL-DEV.md).

To run the End-to-End tests, follow the steps defined in the [e2e
README](../Meadowlark-js/tests/e2e/readme.md).

## Dockerfile for Meadowlark API

In the above scenarios, the Meadowlark API is running in Node.js directly in the
host environment. To run the Meadowlark API itself in Docker, we need a
[Dockerfile](../Meadowlark-js/Dockerfile). This Dockerfile creates a temporary
development environment, copies the Meadowlark source code into the container,
builds it, and then creates a final slimmed down image without the development
tools.

The main [package.json](../Meadowlark-js/package.json) contains a number of
handy commands for dealing with this Dockerfile:

| Command           | Explanation                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| docker:lint       | Runs the Dockerfile through a [Hadolint container](https://github.com/hadolint/hadolint)                                               |
| docker:install    | Used _inside the Docker container build_, not for manual use. Installs required dev tools and runs `npm ci`                            |
| docker:build      | Builds the Docker image. Must run this locally any time source code has changed and you want a new local image                         |
| docker:build:wsl1 | Same as above, but works in Windows Subystem for Linux version 1 (WSL1)                                                                |
| docker:start      | Start the built Docker image by itself; requires a `.env-docker` file with _all_ environment variables set                             |
| docker:start:wsl1 | Same as above, but works in Windows Subystem for Linux version 1 (WSL1)                                                                |
| docker:halt       | Stops and removes the started instance                                                                                                 |
| docker:halt:wsl1  | Same as above, but works in Windows Subystem for Linux version 1 (WSL1)                                                                |
| docker:debug      | Starts the build Docker image, again requiring a `.env-docker` file, and drops you into a Bash session inside of the running container |
| docker:debug:wsl1 | Same as above, but works in Windows Subystem for Linux version 1 (WSL1)                                                                |

For example, from the `Meadowlark-js` directory you can execute `npm run
docker:build` to build the image.

### Build Process

The Dockerfile copies the TypeScript code into a container and runs the
TypeScript build in that context. It does not run eslint or any tests - so
before building, be sure that all test are passing at the command line.

> [!WARNING]
> You will need to rebuild the docker image with `docker:build` any
> time the source code changes. Be sure to stop and re-start any running
> Meadowlark API containers in order to see the changes.

### Testing the Meadowlark Image with Docker Compose

The instructions above are useful for testing the image creation and basic
startup, but not very useful for the API itself: it is hard to get the
networking right to connect that single API container to the other containers
that you might have launched for local development.

A better approach is to startup a new set of containers in a single network
together, completely independent from the "Local Dev" containers. For that, you
can use the local [docker-compose.yml](../Meadowlark-js/docker-compose.yml)
file. This single file stitches together the Meadowlark API, OpenSearch, and
MongoDB. The file also contains commented out code for running PostgreSQL,
Debezium and Kafka, to use this, follow the instructions defined in the readme
for each backend.

Again the main package.json has a few useful shortcut commands:

| Command           | Explanation                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| compose:up        | Starts all of the containers in the compose file, in detached mode; first time users see note below |
| compose:up:wsl1   | Same as above, but works in Windows Subystem for Linux version 1 (WSL1)                             |
| compose:down      | Stops all of the containers in the compose file.                                                    |
| compose:down:wsl1 | Same as above, but works in Windows Subystem for Linux version 1 (WSL1)                             |
| compose:rm        | Shutdowns and _completely removes_ the Compose environment, including all storage volumes           |
| compose:rm:wsl1   | Same as above, but works in Windows Subystem for Linux version 1 (WSL1)                             |

### One Time Initialization

> [!TIP]
> Windows users: you need to run this from Window Subsystem for Linux.
> Make sure that you run a Bash prompt from WSL, not the one provided by Git.
> You also need to have Node.js 18 installed _inside WSL_. The development team
> likes using [NVM](https://github.com/nvm-sh/nvm) to manage this installation
> of Node 18.

From a Bash prompt, run init-docker-compose.sh.

```bash
# Assuming you start in the repository's root directory
chmod +x ./eng/init-docker-compose.sh
./eng/init-docker-compose.sh
```

What does this do?

1. Creates a `.env-docker` file for you, with new random OAuth 2.0 signing key
   and random MongoDb and OpenSearch passwords.
2. Builds the Meadowlark-API image.
3. Configures the MongoDB cluster / replica set.

### External URI's

Based on the default configuration:

| Service              | URL                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------- |
| API                  | http://localhost:3000/local                                                            |
| OpenSearch Dashboard | http://localhost:5602                                                                  |
| MongoDB              | mongodb://mongo:${MONGODB_PASS}@mongo1:27027,mongo2:27028,mongo3:27029/?replicaSet=rs0 |

You can get the MongoDB password from the generated `Meadowlark-js/.env-docker`
file.

# Meadowlark Local Development and Deployment

These are the instructions for setting up a local environment for Meadowlark
development and testing. These instructions are independent of remote
deployment.

## Required Toolkit

* NodeJs 16.
  * The project will fail with Node 18+.
  * It is recommended to use [NVM](https://github.com/nvm-sh/nvm) or [NVM-Windows](https://github.com/coreybutler/nvm-windows) to manage this installation of Node 16.
* Docker Desktop or equivalent
* Visual Studio Code (recommended)

## Repo structure

Meadowlark-js is structured as a monorepo managed by Yarn and Lerna. There are three
directories that contain npm packages:

* `services`: The Meadowlark custom frontend runner, e.g. Fastify
* `backends`: The Meadowlark custom backend plugins providing primary data storage and
  reference validation e.g. MongoDB, PostgreSQL
* `packages`: The Meadowlark packages providing core functionality and libraries
  for the frontend and backend packages

The `docker` directory contains Docker Compose files supporting the frontends and backends.
The `test` directory contains test scripts to exercise the API. Similar to Postman,
these scripts are .http files that use the Visual Studio Code [REST
Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension.

## Local Installation

See [Running on Localhost](LOCALHOST.md).

## Visual Studio Code

* Start Visual Studio Code and open the `meadowlark-js` directory.
* Install all extension recommendations.
* Open a terminal in the meadowlark-js directory and run `npm install`.
  * Note that `npm install` will add a git hook to run linters before pushing
    with git.

## Test a local deploy

Meadowlark is bundled with test scripts to exercise the API.

* Run `npm run build` from the root `Meadowlark-js` directory.
* Run `npm run start:local`
* Use a `test/http/local.*.http` file to make API calls.

## Load Ed-Fi Descriptors

Meadowlark is packaged with the full set of Ed-Fi descriptors for Data Standard
3.3.1-b which, while not required, must be loaded in order for descriptors to
validate successfully.

* Run `npm run start:local` in one shell.
* In a second shell, cd into the `eng`.
* Open one of the `Invoke-Load?.ps1` PowerShell scripts; comment out the last
  line of the script so that only descriptors run.

This uses the ODS/API's dotnet-based client side bulk loader utility to open the descriptor XML files and load the resources one-by-one through the API. This is essentially how the ODS/API's minimal template is populated.

## Other Build Scripts

For other build / operation scripts, please review the [general
package.json](../Meadowlark-js/package.json) (repository-wide commands) file or the individual
package.json files in each package.

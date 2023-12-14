# Running End to End tests

To run the tests, select one of the available modes

## Modes of running End to End tests

### Local Mode

This will run the end to end tests against your existing local environment. This
will not load any new environment variables and use the ones defined for
[fastify](../../services/meadowlark-fastify/readme.md).

Run `npm run test:e2e:jest:local` to run the tests using the existing local
environment. This will read the .env file inside the services/meadowlark-fastify
folder instead of the e2e environment.

This allows to do changes to the running service and see the changes
immediately, as well as debugging the local Meadowlark code from VSCode by
setting breakpoints and running with the included jest VSCode debugger.

> [!NOTE]  
> This mode is recommended when doing new development into Meadowlark and you
> want to test your changes.

> [!WARNING]  
>
> * This requires the current environment to be already running.
> * If the tests does not have a correct teardown step or if there was an error
> cleaning the database, you will have to manually clean your databases and/or
> indexes to avoid unexpected behavior.

### Isolated mode

This will run the end to end tests with
[TestContainers](https://node.testcontainers.org/). It will automatically setup
the containers to run the tests against and will delete the containers
afterwards.

* To setup, create a .env-e2e file in the same location as the
  [example](./setup/.env-e2e.example) with the required values
* Run `npm run test:e2e:build` to build the meadowlark Docker image
* Verify that the environment variable `DEVELOPER_MODE` is not set to true
* Run the tests in isolated mode `npm run test:e2e:jest:tc`

#### Using published image

If you want to run the tests against and existing Docker image, set the variable
`API_IMAGE_NAME` in the .env file. Run the tests with `npm run
test:e2e:jest:tc`. This will pull the image and run the tests against that image.

> [!NOTE]  
> This mode is recommended when exploring or verifying an installation, or
> verifying that the tests are passing correctly in the local environment.

> [!WARNING]  
> This mode will run against a compiled version of the code, so after making
> changes in the Meadowlark code (not the tests), you must build the code again.
> This mode ignores all values in the different .env files other than the
> env-e2e file.

### Developer Mode

This is a special mode that will setup a group of containers in different ports
(denoted with the names -test) and will not delete the containers after each
run.

- To setup, run: `npm run test:e2e:dev:setup`. This will configure the test
  containers
- Set the environment variable `DEVELOPER_MODE=true`
- Run `npm run test:e2e:jest:tc` to run the tests
- Save the Admin Key and Secret (as specified in
[.env-e2e.example](./setup/.env-e2e.example)) to be able to run the tests
without cleaning the environment
- When done, run: `npm run test:e2e:dev:exit` or execute the
  `exit-dev-containers.ps1` script to clean the environment.

> [!NOTE]  
> This mode is recommended when adding new end to ends tests.

> [!WARNING]  
> When running side to side with a "real" installation of Meadowlark, verify the
> ports being used to make sure that you are running against the TestContainers
> and not the real ones.

## Troubleshooting

`API Image not found`

Review the step 3 and check that the image is being generated

`No Docker client strategy found`

Verify that Docker is up and running

:warning: When running on Windows, there might be some issues related to Docker
and WSL. :warning:

`Error: docker endpoint for "default" not found`

This is an issue with Docker Compose and WSL 2, see [full
discussion](https://github.com/docker/compose/issues/9956). To fix, go to
C:\Users\your-username and delete the .docker folder. Restart Docker and run the
tests again. This does not affects your running containers or configuration.

`Error: (HTTP code 500) server error - i/o timeout`

This is an error with Docker Desktop. Restart Docker and run tests again

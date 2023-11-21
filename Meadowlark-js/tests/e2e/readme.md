# Running End to End tests

To run the tests:

1. Create a .env file based on .env.example in this folder.
2. Verify that Docker is running
3. There are two ways to run the e2e tests:
   - To create the meadowlark docker image and run the tests against that image, run `npm run test:e2e:build`
   - To use a previously built image (can be built once with `npm run docker:build`), run `npm run test:e2e`

## Support

Postgresql support is currently disabled and should be included again once Postgresql support is matched on main code.

## Modes of running End to End tests

### Local Mode

This will run the end to end tests against your existing local environment. This will not load any new environment variables
and use the ones defined for fastify.

> [!NOTE]  
> This mode is recommended when doing new development into Meadowlark and you want to test your changes.

> [!WARNING]  
> If the tests does not have a correct teardown step or if there was an error cleaning the database, you will have to
> manually clean your databases and/or indexes to avoid unexpected behavior.

### Isolated mode

This will run the end to end tests with [TestContainers](https://node.testcontainers.org/). It will automatically setup the
containers to run the tests against and will delete the containers afterwards.

- To setup, create a .env-e2e file in the same location as the [example](./setup/.env-e2e.example) with the required values.
- Run `test:e2e:build` to build the code and then run the tests in isolated mode.

> [!NOTE]  
> This mode is recommended when exploring or verifying an installation, or verifying that the tests are passing correctly in
> the local environment.

> [!WARNING]  
> This mode will run against a compiled version of the code, so after making changes in the Meadowlark code (not the tests),
> you must build the code again. This mode ignores all values in the different .env files other than the env-e2e file.

### Developer Mode

This is a special mode that will setup a group of containers in different ports (denoted with the names -test) and will not
delete the containers after each run.

- To setup, run: `npm run test:e2e:dev:setup`. This will configure the test containers
- Set the environment variable `DEVELOPER_MODE=true`
- Run `npm run test:e2e:jest:tc` to run the tests. Save the Admin Key and Secret (as specified in
[.env.example](./setup/.env.example)) to be able to run the tests without cleaning the environment
- When done, run: `npm run test:e2e:dev:exit` or execute the `exit-dev-containers.ps1` script to clean the environment.

> [!NOTE]  
> This mode is recommended when adding new end to ends tests.

> [!WARNING]  
> When running side to side with a "real" installation of Meadowlark, verify the ports being used to make sure that you are
> running against the TestContainers and not the real ones.

## Troubleshooting

`API Image not found`

Review the step 3 and check that the image is being generated

`No Docker client strategy found`

Verify that Docker is up and running

:warning: When running on Windows, there might be some issues related to Docker and WSL. :warning:

`Error: docker endpoint for "default" not found`

This is an issue with Docker Compose and WSL 2, see [full discussion](https://github.com/docker/compose/issues/9956). To fix,
go to C:\Users\your-username and delete the .docker folder. Restart Docker and run the tests again. This does not affects
your running containers or configuration.

`Error: (HTTP code 500) server error - i/o timeout`

This is an error with Docker Desktop. Restart Docker and run tests again

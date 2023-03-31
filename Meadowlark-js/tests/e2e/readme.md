# Running End to End tests

To run the tests:

1. Create a .env file based on .env.example in this folder.
2. Verify that Docker is running
3. There are two ways to run the e2e tests:
   - To create the meadowlark docker image and run the tests against that image, run `npm run test:e2e:build`
   - To use a previously built image (can be built once with `npm run docker:build`), run `npm run test:e2e`

## Support

Postgresql support is currently disabled and should be included again once Postgresql support is matched on main code.

## Troubleshooting

`API Image not found`

Review the step 3 and check that the image is being generated

`No Docker client strategy found`

Verify that Docker is up and running

:warning: When running on Windows, there might be some issues related to Docker and WSL. :warning:

`Error: docker endpoint for "default" not found`

This is an issue with Docker Compose and WSL 2, see [full discussion](https://github.com/docker/compose/issues/9956).
To fix, go to C:\Users\your-username and delete the .docker folder. Restart Docker and run the tests again. This does not affects your running containers or configuration.

`Error: (HTTP code 500) server error - i/o timeout`

This is an error with Docker Desktop. Restart Docker and run tests again


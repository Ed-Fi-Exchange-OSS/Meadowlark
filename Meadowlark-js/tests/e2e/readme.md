# Running End to End tests

To run the tests:

1. Create a .env file based on .env.example in this folder.
2. Ensure that the shell scripts in `scripts` are set as executable.
3. Verify that Docker is running
4. Run `npm run test:e2e`

## Support

Postgresql support is currently disabled and should be included again once Postgresql support is matched on main code.

## Troubleshooting

:warning: When running on Windows, there might be some issues related to Docker and WSL. :warning:

`Error: docker endpoint for "default" not found`

This is an issue with Docker Compose and WSL 2, see [full discussion](https://github.com/docker/compose/issues/9956).
To fix, go to C:\Users\your-username and delete the .docker folder. Restart Docker and run the tests again. This does not affects your running containers or configuration.

`Error: (HTTP code 500) server error - i/o timeout`

This is an error with Docker Desktop. Restart Docker and run tests again

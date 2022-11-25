# Running End to End tests

There are two options to run the tests:

a. If meadowlark-fastify is already running, the tests can be executed by setting a .env file with the ADMIN_KEY and ADMIN_SECRET values, and any other variables available to avoid user creation.

b. If fastify is not running, copy the values on the meadowlark-fastify .env files into the e2e .env file

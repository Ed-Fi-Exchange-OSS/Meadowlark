# PostgreSQL Backend for Meadowlark

:exclamation: This solution should only be used on localhost with proper firewalls around
external network access to the workstation. Not appropriate for production use.

This Docker Compose file provisions a single instance of PostgreSQL 14.

## Preparatory Steps

You can customize the PostgreSQL startup with three environment variables, which can also
be placed into a `.env` file:

* `POSTGRES_USER` (default value: "postgres")
* `POSTGRES_PASSWORD` (default value: "abcdefgh1!")
* `POSTGRES_PORT` (default value: 5432)

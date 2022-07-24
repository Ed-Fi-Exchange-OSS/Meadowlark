These are SQL scripts for PostgreSQL backend initialization.

document-index.sql - Adds a GIN "pathops" index to the edfi_doc JSONB column, improving the
                     performance of ad-hoc document queries at the cost of slower writes.
                     This is only necessary in a PostgreSQL "standalone" configuration,
                     where the PostgreSQL backend is providing API search query support,
                     as opposed to using a separate search engine.
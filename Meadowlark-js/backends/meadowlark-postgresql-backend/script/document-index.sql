-- Adds a GIN "pathops" index to the edfi_doc JSONB column, improving the
-- performance of ad-hoc document queries at the cost of slower writes.
-- This is only necessary in a PostgreSQL "standalone" configuration,
-- where the PostgreSQL backend is providing API search query support
-- (as opposed to using a separate search engine like OpenSearch).
CREATE INDEX IF NOT EXISTS ix_meadowlark_documents_edfi_doc ON meadowlark.documents USING GIN (edfi_doc jsonb_path_ops);

-- TODO: Add an index for ResourceInfo e.g. the (project name, resource name, resource version) tuple

-- Search queries will need to be constructed to perform as well as possible, given that GIN indexes are not sortable,


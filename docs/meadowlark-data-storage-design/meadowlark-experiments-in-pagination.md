# Meadowlark - Experiments in Pagination

## Overview

For large databases, pagination with LIMIT x OFFSET y queries becomes very slow as you go deeper and deeper into the search results. What options does Meadowlark's usage of OpenSearch, MongoDB, and PostgreSQL provide? What performance characteristics can we expect?

Note: pagination in the Ed-Fi API specification always has the potential to go hand-in-hand with queries, therefore this article assumes that both must be supported at the same time.

## Standard Techniques

### LIMIT x OFFSET y

Fetches X number of rows, skipping Y number of rows. The skipping part is what can take a very long time as you go deeper into the result set. There is also the danger data changes between page requests.

### Keyset Pagination

A better technique can be to fetch a small number of records, and use a monotonically-increasing key field in a WHERE clause to select the next group of records. This is referred to as either the *seek method* and *keyset pagination*, and seems to have been first documented in [Paging Through Results](https://use-the-index-luke.com/sql/partial-results/fetch-next-page). This approach takes full advantage of database indexing.

### Cursors

Cursor-based pagination is common in GraphQL queries. As describing in [Paginating Requests in APIs](https://ignaciochiazzo.medium.com/paginating-requests-in-apis-d4883d4c1c4c), the "cursor" is essentially a pointer to the next record that should be fetched. Thus it is conceptually similar to a keyset approach. However, it might be subject to problems when a new record appears in the sort order *before* the next cursor.

## Meadowlark Database Engines

In the current design, all documents are written to either MongoDB or PostgreSQL for basic transactional support. The data are also written to OpenSearch, and GET ALL and GET by QUERY type requests go against the OpenSearch database with its powerful indexing. However, MongoDB and PostgreSQL also have document indexing capabilities.

### Pagination in OpenSearch

OpenSearch supports all three patterns. The cursor-based pattern is poorly documented; in fact, the official documentation only mentions [limitations](https://opensearch.org/docs/latest/search-plugins/sql/limitation/) to cursor-based paging, without ever mentioning how to use it. The limitations mention that only [basic queries](https://opensearch.org/docs/latest/search-plugins/sql/basic/) are supported; this fits the potential Meadowlark usage pattern, which would not use sub-queries or joins ([complex queries](https://opensearch.org/docs/latest/search-plugins/sql/complex/)). However, there is a markdown document describing [OpenSearch SQL Cursor (Pagination) Support](https://github.com/opensearch-project/sql/blob/2.1/docs/dev/Pagination.md) in the source repository.

### Pagination in MongoDB

*An aside:*

MongoDB [does support indexing](https://www.mongodb.com/docs/v4.0/indexes/) into a document, without which there would be no point to the pagination. In theory, we could use MongoDB alone for queries, instead of relying on OpenSearch. Trying to build the right indexes might be difficult, especially with multikey indexes to cover the possibility of querying on multiple fields. Multikey indexing might necessitate moving to a design of one collection ("table") per resource, instead of having a single collection that contains all resources. It also would likely benefit from using the MetaEd model introspection to find the queryable fields and auto-generate indexes.

*Back to the  topic:*

As described in [MongoDB Pagination, Fast & Consistent](https://medium.com/swlh/mongodb-pagination-fast-consistent-ece2a97070f3), both the LIMIT x OFFSET y and keyset pagination, with similar limitations on OFFSET as other systems. In MongoDB, the first pattern is uses the [skip()](https://www.mongodb.com/docs/v4.0/reference/method/cursor.skip/) function for the "offset". The keyset pattern is similar to other systems, using a limit combined with a greater than query. MongoDB calls these Range Queries.

### Pagination in PostgreSQL

*Aside*:

Similar to MongoDB, in theory we could switch to using indexes directly in PostgreSQL instead of utilizing OpenSearch. These are called [GIN indexes](https://pganalyze.com/blog/gin-index). Similar design concerns may apply.

*Back to the topic:*

> [!INFO]
> I have not been able to find any blogs or documentation that explicitly discuss pagination with GIN indexes on JSONB structures. PostgreSQL has LIMIT x OFFSET y support, and naturally "normal" tables it can be used for keyset pagination. Update this section after doing more research.
> [https://www.citusdata.com/blog/2016/03/30/five-ways-to-paginate/](https://www.citusdata.com/blog/2016/03/30/five-ways-to-paginate/) shows cursors in the psql-language, but how would those be represented in API-based queries, as opposed to "shell" sessions or single synchronous scripts?
> [Paginating Large, Ordered Data Sets with Cursor-Based Pagination](https://brunoscheufler.com/blog/2022-01-01-paginating-large-ordered-datasets-with-cursor-based-pagination) describes a possible approach to creating GraphQL-style cursors that essentially employ the keyset pagination technique.
>
> Some information on GIN indexing in general, and ordering issues in particular:
>
> * Blog post overview of GIN indexing: [https://pganalyze.com/blog/gin-index](https://pganalyze.com/blog/gin-index)
> * PostgreSQL docs on only b-tree indexes supporting sort: [https://www.postgresql.org/docs/current/indexes-ordering.html](https://www.postgresql.org/docs/current/indexes-ordering.html)
> * PostgreSQL perf mailing list on GIN + ORDER BY issues: [https://www.postgresql.org/message-id/flat/56B332B6.1040109@promani.be](https://www.postgresql.org/message-id/flat/56B332B6.1040109%40promani.be)
>
> Other references I've found are on Stack Overflow with reports of performance tanking when GIN indexes are used with ORDER BY.

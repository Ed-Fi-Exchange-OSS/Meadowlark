# Ed-Fi Meadowlark Performance Testing Results

* [RND-538: Load balancing API scale out](load-balancing-API-scale-out.md).
Summary: There are no performance improvements when using a load balancer, we
  suspect this is caused by a bottleneck in MongoDB.

* [RND-380: MongoDB Connection Pooling](mongo-connection-pooling.md). Summary:
When using the clustered mode, no discernible benefit to tuning MongoDB
  connection pooling while loading the "partial Grand Bend" dataset. Also
  includes comparison with ODS/API v5.3-patch4.

* [RND-538: MongoDB performance testing](mongo-performance-testing.md). Summary:
There are performance improvements when removing the write locks and the read
performance improve when removing indices.

* [RND-647: PostgreSQL performance testing](postgres-performance-testing.md).
Summary: Removing indices and increasing the connection pool can improve the
performance.

* [RND-643: PostgreSQL Serializable Snapshot Isolation (SSI) performance
testing](postgres-SSI-performance-testing.md). Summary: For SSI to be effective,
retry logic must be implemented, otherwise many transactions would fail without
altering any records.

* [RND-644 - Investigate alternatives to MongoDB backend
read-for-write-locking](RND-644.md). Summary: There are no significant
  differences on changing the current approach.

* [RND-658 - Comparison of PostgreSQL and MongoDB performance](RND-658.md).
  Summary: See document for detailed results

* [RND-668 - Compare ODS/API 5.3 bulk load with outcomes of
  RND-658](RND-668.md). Summary: See document for detailed results

* [RND-604: Separate kafka connect containers to separate sources from
  sink](two-functionalities-of-kafka-connect-separated.md). Summary: There are
  no significant differences when separating the source from the sink.

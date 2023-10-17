# RND-643: PostgreSQL Serializable Snapshot Isolation (SSI) performance testing

## Goal

Run Postgresql performance to compare the performance of the SSI implementation vs the SELECT...FOR UPDATE/SHARE implementation.

## Description

To test performance we use Autocannon tool.

Changed transaction usage to use SSI. Additionally, retry logic was added with this change. With this logic, if a 40001 error occurs, a retry is executed. All functions that use transactions have been modified.

As a side effect, the crash test\delete.test.ts failed. This test has transactions to create a lock and has no retry mechanism, so the test creates a deadlock and returns a timeout error.

To capture database statistics we are reading data from pg_stat_database. A process runs each 5 seconds and inserts a row with the current statistics. With all the rows inserted, we can get an average of some indicators. From pg_stat_database we can get:

- xact_commit: number of transactions in the database that have been completed successfully.
- xact_rollback: number of transactions that have been cancelled or rolled back.
- blks_read: number of disk blocks that have been read directly from the disk
- blks_hit: This is the number of times that the needed data was found in the cache or buffer.
- tup_returned: number of rows returned by queries in the database
- tup_fetched: number of rows fetched by queries in the database
- tup_inserted: number of rows inserted
- tup_updated: number of rows updated
- tup_deleted: number of rows deleted

## Postgres Comparison

For testing, Autocannon was run in the existing version in main and in the modified version. For each test, 3 iterations were executed and the comparison was made with the data obtained.

First, we tested Autocannon with the original version and the modified version.

||2xxx|Non-2xxx|Latency|Request|Throughput
| :--- | ---: | ---: | ---: | ---: | ---: |
**Non-SSI**|7075.67|0|564.35|44.51|15532.14
**SSI**|5723.33|8659.66666666667|277.82|90.28|28020.23
**Differences**|**-19.11%**|**100.00%**|**-50.77%**|**102.83%**|**80.40%**

For this case we can see:

- The SSI version has less 2xxx responses and more Non-2xxx. Now, we this change we are not locking the database, so that behavior is expected.
- In the same case, the SSI version has less latency and more requests and throughput compared to the original version.

With this results we can see some improvement in the performance.

Now, if we compare database statistics, we have the following results:

|Pool Size | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Non-SSI|328.20|0|30.52|7662.52|1432.53|788.24|327.96|73.20|281.24
SSI|149.51|98.88|17.03|5955.38|4748.24|445.19|151.52|46.46|153.13
|**Differences**|**-54.00%**|**100.00%**|**-44.00%**|**-22.00%**|**231.00%**|**-44.00%**|**-54.00%**|**-37.00%**|**-46.00%**

These results are consistent with the Autocannon results:

- SSI version has less commits than previous version, and more rollbacks than previous version, that makes sense because we are not locking the database and we are executing a rollback to retry.
- Also, SSI version returned more tuples but affected tuples are less compared to previous version. That behavior is consistent with a retry mechanism, because when we need to retry, we need to restart the process.

## Conclusion
- The version with SSI reduces latency but also generates a large amount of rollback, so the number of altered records is smaller.

- Additionally, in cases like locking\delete.test.ts, removing the SELECT...FOR UPDATE/SHARE can cause errors and deadlocks.

- For SSI to be effective, retry logic must be implemented, otherwise many transactions would fail without altering any records.
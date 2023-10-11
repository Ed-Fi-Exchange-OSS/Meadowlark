# RND-647: Postgresql performance testing

## Goal

Run Postgresql performance testing to see the time required to execute Meadowlark on Postgresql.

## Description

To test performance we have two Methods:
- Autocannon tool
- Bulk Load data

With these methods we test different scenarios to validate changes in the code. We capture at least 3 execution cycles for each scenario.

## Method 1: Postgres Connection Pool

As a first step we are execute the Autocannon tool changing the amount of connections.
First we executed a base case with 1 connection and then more cases were executed to compare the behavior. Then, we change the max pool size to validate the behavior.

1. Start postgresql and open search containers.

2. Start Meadowlark on the host machine with Fastify service.

3. Run the process to capture postgres statistics.

4. Run Autocannon tool

5. Reset statistics and clean database tables.

6. Repeat for a total of 3 measurements with the same settings

8. After the third execution, change the amount of connections and repeat from step 1.
   1. Connections tested
      1. 1 connection
      3. 50 connections

### Autocannon results
First, we test Meadowlark with the default max pool size for Postgresql (max: 10), using 1 Autocannon connection and 50 connections.

|Test|Request|Latency|Throughput|2xxx|
| :--- | ---: | ---: | ---: | ---: |
1 conn|18.11333333|55.11|6320.383333|2879
50 conn|1047.44|48.01666667|16758.55667|10967.33333

For the second iteration, we changed the max pool size to 25.
|Test|Request|Latency|Throughput|2xxx|
| :--- | ---: | ---: | ---: | ---: |
1 conn|54.84333333|18.19|6347.05|2903.666667
50 conn|1099.82|45.67|15938.95|7260.666667

With 1 connection the results were:
|Test|Request|latency|throughput|2xxx|
| :--- | ---: | ---: | ---: | ---: |
1 conn (max pool: 10)|18.11333333|55.11|6320.383333|2879
1 conn (max pool: 25)|54.84333333|18.19|6347.05|2903.666667
**Difference**|**203%**|**-67%**|**0%**|**1%***

In this case, when we increased the Pool, the request amount increased 203% and the latency decreased by 67%.

For the second scenario with 50 autocannon connections we have:
|Test|Request|latency|throughput|2xxx|
| :--- | ---: | ---: | ---: | ---: |
50 conn|1047.44|48.01666667|16758.55667|7634
50 conn|1099.82|45.67|15938.95|7260.666667
**Difference**|**5%**|**-5%**|**-5%**|**5%**

For this second case, the request amount increased by 5%, and the latency also decreased by 5%.

## Method 2: Database changes

As a second step, we are going to run performance tests with bulkload
when the code that creates the indexes as been removed.

As a first step we want to know the performance impact of the creation of the indexes, adding more connections and removing the Share Not Wait. We are going to do this with the bulk load tool.

To capture statistics we are reading data from pg_stat_database. A process runs each 5 seconds and inserts a row with the current statistics. With all the rows inserted, we can get an average of some indicators. From pg_stat_database we can get:

- xact_commit: number of transactions in the database that have been completed successfully.
- xact_rollback: number of transactions that have been cancelled or rolled back.
- blks_read: number of disk blocks that have been read directly from the disk
- blks_hit: This is the number of times that the needed data was found in the cache or buffer.
- tup_returned: number of rows returned by queries in the database
- tup_fetched: number of rows fetched by queries in the database
- tup_inserted: number of rows inserted
- tup_updated: number of rows updated
- tup_deleted: number of rows deleted

1. Start postgresql and open search containers.

2. Clean database Tables.

3. Start Meadowlark on the host machine with Fastify service.

4. Run the process to capture postgres statistics.

5. Bulk upload the "partial grand bend" data set, capturing the time taken.

   ```pwsh
   cd ../eng/performance
   .\BulkLoad-Performance.ps1 -Template "PartialGrandBend"
   ```

6. Repeat for a total of 3 measurements with the same settings

7. Comment out, individually, the createIndex calls on SqlHelper.ts.

8. Repeat the measurement process.

### Database Results

|Test | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Control |256.31|0.00|12.18|2382.67|407.66|106.25|176.64|0.25|0.23
Pool 25 conn |258.23|0.00|21.28|2396.86|415.52|112.89|179.59|0.31|0.28
Remove ReferencesTableCheckingIndex |254.39|0.00|12.80|2385.00|546.14|107.69|179.76|0.30|0.28
Remove ReferencesTableDeletingIndex |255.54|0.00|6.80|2383.82|390.35|104.72|175.17|0.30|0.27
Remove AliasesTableMeadowlarkIdIndex |256.44|0.00|13.11|2351.87|432.15|106.80|174.75|0.27|0.24
Remove AliasesTableDocumentUuid |256.55|0.00|15.08|2390.24|427.48|105.88|176.79|0.30|0.27
Remove AliasesTableAliasMeadowlarkIdIndex |163.59|4.01|7.37|1060.49|2666.83|51.76|76.20|0.28|0.22
Remove SHARE NOT WAIT AliasMeadowlarkIdsForDocumentByDocumentUuid |147.67|5.69|8.91|1024.87|1385.07|82.33|67.23|0.55|0.45
Remove SHARE NOT WAIT AliasMeadowlarkIdsForDocumentByMeadowlarkId |170.22|10.07|10.68|1177.13|2109.52|69.74|74.79|0.56|0.37

### Comparing metrics

With these test, we can compare the control test (a test with no code changes) to see the impact of each change.
| # Conn | % commit | % rollback | % disk blocks read | % blocks hit cache | % tuples returned | % tuples fetched | % tuples_inserted | % tuples updated | % tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Pool 25 conn |0.75|0.00|74.72|0.60|0.00|6.25|1.67|22.57|20.48
Remove ReferencesTableCheckingIndex |-0.75|0.00|5.07|0.10|0.00|1.35|1.77|19.67|18.99
Remove ReferencesTableDeletingIndex |-0.30|0.00|-44.21|0.05|0.00|-1.44|-0.83|18.62|15.65
Remove AliasesTableMeadowlarkIdIndex |0.05|0.00|7.65|-1.29|0.00|0.51|-1.07|4.49|4.64
Remove AliasesTableDocumentUuid |0.10|0.00|23.76|0.32|0.00|-0.35|0.09|17.59|14.67
Remove AliasesTableAliasMeadowlarkIdIndex |-36.17|100.00|-39.50|-55.49|0.00|-51.29|-56.86|10.97|-7.04
Remove SHARE NOT WAIT AliasMeadowlarkIdsForDocumentByDocumentUuid |-42.38|100.00|-26.87|-56.99|0.00|-22.52|-61.94|116.54|91.15
Remove SHARE NOT WAIT AliasMeadowlarkIdsForDocumentByMeadowlarkId |-33.59|100.00|-12.30|-50.60|0.00|-34.36|-57.66|122.01|56.57

In the tests, on the one hand, it can be observed that by increasing the pool of connections there is an improvement in most of the metrics.

On the other hand, the elimination of indexes causes a decrease in the value of some of the metrics, from the number of commits to the number of modified records.

Finally, with Share Not Wait, eliminating it not only decreases the number of commits, but also registers rollbacks, which in other scenarios did not occur.

For all of the above, the effect of the indices could be verified. Likewise, there is the possibility of slightly improving performance by modifying the default value in the connection pool.

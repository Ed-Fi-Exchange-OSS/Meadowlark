# RND-647: Postgresql performance testing

## Goal

Run Postgresql performance testing to see the time required to execute Meadowlark on Postgresql.

## Description

To test performance we have two Methods:
- Autocannon tool
- Bulk Load data

With these methods we test different scenarios to validate changes in the code. We capture at least 3 execution cycles for each scenario.

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

## Method 2

As a first step we are execute the Autocannon tool changing the amount of connections.
First we executed a base case with 1 connection and then more cases were executed to compare the behavior.

1. Start postgresql and open search containers.

2. Start Meadowlark on the host machine with Fastify service.

3. Run the process to capture postgres statistics.

4. Run Autocannon tool

5. Reset statistics and clean database tables.

6. Repeat for a total of 3 measurements with the same settings

8. After the third execution, change the amount and connections and repeat from step 1.
   1. Connections tested
      1. 1 connection (baseline)
      2. 25 connections
      3. 50 connections
      4. 100 connections.

### Results

In this table we can see the average by second of these metrics for each scenario.

| # Conn | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Test 1 connections|1|1|34.31|0.00|3.35|1955.14|441.25|81.84|68.22|17.43|68.22|
| Test 25 connections|1|1|296.05|0.00|3.69|6872.55|6896.46|428.13|194.08|48.94|194.16 |
| Test 50 connections|1|1|301.23|0.00|6.29|5916.13|3947.04|440.38|192.42|48.55|192.64|
| Test 100 connections|1|1|246.20|0.00|3.57|4909.01|2056.77|429.03|186.58|47.01|186.77|

Based on these values we can compare each control test against the base scenario (Test with 1 connection), to see the differences.

| # Conn | % commit | % rollback | % disk blocks read | % blocks hit cache | % tuples returned | % tuples fetched | % tuples_inserted | % tuples updated | % tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Base test 25 connections|762.89|0.00|10.26|251.51|366.13|423.12|184.49|180.83|184.61
| Base test 50 connections|777.97|0.00|87.77|202.59|794.52|438.09|182.05|178.54|182.37
| Base test 100 connections|617.59|0.00|6.52|151.08|1462.94|424.21|173.50|169.75|173.77

### Method 2, Conclusion

<TODO: Update table of connections to include conclusions>

## Method 2

As a second step, we are going to run performance tests with bulkload
when the code that creates the indexes as been removed.

As a first step we want to know the performance impact of the creation of the indexes, adding more connections and removing the Share Not Wait. We are going to do this with the bulk load tool.

1. Start postgresql and open search containers.

2. Start Meadowlark on the host machine with Fastify service.

3. Run the process to capture postgres statistics.

4. Bulk upload the "partial grand bend" data set, capturing the time taken.

   ```pwsh
   cd ../eng/performance
   .\BulkLoad-Performance.ps1 -Template "PartialGrandBend"
   ```

5. Repeat for a total of 3 measurements with the same settings

6. Comment out, individually, the createIndex calls on SqlHelper.ts.

7. Repeat the measurement process.

### Method 2, Results

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

### Method 2, Comparing values

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

### Method 2, Conclusion

In the tests, on the one hand, it can be observed that by increasing the pool of connections there is an improvement in most of the metrics.

On the other hand, the elimination of indexes causes a decrease in the value of some of the metrics, from the number of commits to the number of modified records.

Finally, with Share Not Wait, eliminating it not only decreases the number of commits, but also registers rollbacks, which in other scenarios did not occur.

For all of the above, the effect of the indices could be verified. Likewise, there is the possibility of slightly improving performance by modifying the default value in the connection pool.

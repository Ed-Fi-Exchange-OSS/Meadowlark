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

## Method 1: Postgres Connection Pool

As a first step we are execute the Autocannon tool changing the amount of connections. Pool sizes tested:

- Default: 10
- 25
- 35
- 50

First we executed a base case with 1 connection and then more cases were executed to compare the behavior. Then, we change the max pool size to validate the behavior.

1. Start postgresql and open search containers.

2. Start Meadowlark on the host machine with Fastify service.

3. Run the process to capture postgres statistics.

4. Run Autocannon tool

5. Reset statistics, clean database tables and restart postgresql container.

6. Repeat for a total of 3 measurements with the same settings

7. After the third execution, change the amount of connections and repeat from step 1.
   1. Connections tested
      1. 1 connection
      2. 25 connections
      3. 50 connections

### Autocannon: 1 Autocannon connection

First, we tested Autocannon with Connection: 1 and four different pool sizes.

||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 10|18.11|55.11|6320.38|2879.33
Pool: 25|18.19|54.84|6347.05|2903.67
Pool: 35|14.05|71.51|4904.25|2234.00
Pool: 50|17.25|57.91|6016.39|2746.67

For this case, if we compare the results of the base code (the default pool size: 10), we have these results:
||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 25|0.44%|-0.49%|0.42%|0.85%|0.40%
Pool: 35|-22.42%|29.76%|-22.41%|-22.41%|-100.00%
Pool: 50|-4.77%|5.09%|-4.81%|-4.61%|0.17%

In terms of metrics, with a pool size of 25 there was an increase in request and throughput and a reduction in latency. For other cases, the behavior is the opposite.

Also, if we compare database metrics, these results are consistent with autocannon.

|Pool Size | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Default: 10 |35.21|0.00|14.01|4819.40|438.46|20.99|70.06|17.85|70.07
Pool: 25|35.88|0.00|14.48|5097.58|378.85|15.25|71.34|18.15|71.30
Pool: 35|28.07|0.00|14.80|3236.27|316.53|13.32|55.76|14.28|55.76
Pool: 50|34.22|0.00|14.53|4831.98|431.36|19.47|68.08|17.35|68.09

Differences compared to base test.
|Pool Size | % commit | % rollback | % disk blocks read | % blocks hit cache | % tuples returned | % tuples fetched | % tuples_inserted | % tuples updated | % tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Pool: 25|1.92|0.00|3.32|5.77|0.00|-27.35|1.82|1.73|1.75
Pool: 35|-20.27|0.00|5.65|-32.85|0.00|-36.53|-20.40|-19.96|-20.41
Pool: 50|-2.80|0.00|3.73|0.26|0.00|-7.28|-2.83|-2.76|-2.83

### Autocannon: 25 Autocannon connections

Similar to the first scenario, we tested Autocannon with 25 Autocannon connections and four different pool sizes.

||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 10|45.99|546.48|16048.36|7311
Pool: 25|44.35|566.59|15476.04|7050.33
Pool: 35|43.9|571.76|15321.25|6979.67
Pool: 50|41.45|607.92|14466.72|6590.33

For this case, if we compare the results of the base code (the default pool size: 10), we have these results:
||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 25|-3.57%|3.68%|-3.57%|-3.57%
Pool: 35|-4.54%|4.63%|-4.53%|-4.53%|
Pool: 50|-9.87%|11.24%|-9.86%|-9.86%|

For this case, the default pool size had better metrics. And again, we can contrast this with postgres statistics

|Pool Size | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Default: 10|279.28|0.00|15.41|6201.33|5516.73|376.94|177.90|44.65|177.39
Pool: 25|272.59|0.00|17.53|6264.49|6157.64|404.88|175.60|44.21|175.40
Pool: 35|275.45|0.00|17.89|6510.12|6480.80|356.15|172.73|43.54|172.72
Pool: 50|262.38|0.00|17.37|6604.71|5498.47|313.05|163.07|41.00|162.55

Here, we can see the differences between the default pool size and the rest of the pool sizes.
|Pool Size | % commit | % rollback | % disk blocks read | % blocks hit cache | % tuples returned | % tuples fetched | % tuples_inserted | % tuples updated | % tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Pool: 25|-2.40|0.00|13.75|1.02|0.00|7.41|-1.29|-0.99|-1.12
Pool: 35|-1.37|0.00|16.09|4.98|0.00|-5.51|-2.90|-2.49|-2.64
Pool: 50|-6.05|0.00|12.70|6.50|0.00|-16.95|-8.33|-8.17|-8.37

### Autocannon: 50 Autocannon connections

The last case uses 50 Autocannon connections with different pool sizes.

||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 10|48.02|1047.44|16758.56|7634.00
Pool: 25|45.67|1099.82|15938.95|7260.67
Pool: 35|45.85|1094.93|15999.63|7304.33
Pool: 50|45.47|1104.55|15868.14|7244.33

For this case, if we compare the results of the base code (the default pool size: 10), we have these results:
||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 25|-4.89%|5.00%|-4.89%|-4.89%
Pool: 35|-4.52%|4.53%|-4.53%|-4.32%
Pool: 50|-5.32%|5.45%|-5.31%|-5.10%

In a similar way to using a max pool size of 35, with 50 connections a reduction in the main indicators is seen with respect to the base case.

|Pool Size | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Default: 10|298.77|0.00|16.48|6052.86|4015.65|429.07|186.90|46.82|185.92
Pool: 25|285.33|0.00|12.40|5925.35|4321.19|383.33|180.46|45.36|180.45
Pool: 35|292.03|0.00|18.95|5568.52|3793.43|408.56|180.60|45.19|179.17
Pool: 50|274.39|0.00|15.10|5248.36|3037.52|410.90|178.28|44.55|176.84

And difference between the default case and the rest of cases.

|Pool Size | % commit | % rollback | % disk blocks read | % blocks hit cache | % tuples returned | % tuples fetched | % tuples_inserted | % tuples updated | % tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Pool: 25|-4.50|0.00|-24.76|-2.11|0.00|-10.66|-3.45|-3.13|-2.94
Pool: 35|-2.25|0.00|15.00|-8.00|0.00|-4.78|-3.37|-3.48|-3.63
Pool: 50|-8.16|0.00|-8.35|-13.29|0.00|-4.23|-4.61|-4.85|-4.88

### Conclusion

Of the scenarios analyzed, the improvement received occurred when Autocannon used a connection with a max pool size equal to 25.

In the other cases, the increase in the Connection Pool showed worse metrics compared to the base case of the default Pool size (max: 10).

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

## Method 1: Postgres Connection Pool

As a first step we are execute the Autocannon tool changing the amount of connections. Pool sizes tested:

- Default: 10
- 25
- 35
- 50

First we executed a base case with 1 connection and then more cases were executed to compare the behavior. Then, we change the max pool size to validate the behavior.

1. Start postgresql and open search containers.

2. Start Meadowlark on the host machine with Fastify service.

3. Run the process to capture postgres statistics.

4. Run Autocannon tool

5. Reset statistics, clean database tables and restart postgresql container.

6. Repeat for a total of 3 measurements with the same settings

7. After the third execution, change the amount of connections and repeat from step 1.
   1. Connections tested
      1. 1 connection
      2. 25 connections
      3. 50 connections

### Autocannon: 1 Autocannon connection

First, we tested Autocannon with Connection: 1 and four different pool sizes.

||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 10|18.11|55.11|6320.38|2879.33
Pool: 25|18.19|54.84|6347.05|2903.67
Pool: 35|14.05|71.51|4904.25|2234.00
Pool: 50|17.25|57.91|6016.39|2746.67

For this case, if we compare the results of the base code (the default pool size: 10), we have these results:
||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 25|0.44%|-0.49%|0.42%|0.85%|0.40%
Pool: 35|-22.42%|29.76%|-22.41%|-22.41%|-100.00%
Pool: 50|-4.77%|5.09%|-4.81%|-4.61%|0.17%

In terms of metrics, with a pool size of 25 there was an increase in request and throughput and a reduction in latency. For other cases, the behavior is the opposite.

Also, if we compare database metrics, these results are consistent with autocannon.

|Pool Size | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Default: 10 |35.21|0.00|14.01|4819.40|438.46|20.99|70.06|17.85|70.07
Pool: 25|35.88|0.00|14.48|5097.58|378.85|15.25|71.34|18.15|71.30
Pool: 35|28.07|0.00|14.80|3236.27|316.53|13.32|55.76|14.28|55.76
Pool: 50|34.22|0.00|14.53|4831.98|431.36|19.47|68.08|17.35|68.09

Differences compared to base test.
|Pool Size | % commit | % rollback | % disk blocks read | % blocks hit cache | % tuples returned | % tuples fetched | % tuples_inserted | % tuples updated | % tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Pool: 25|1.92|0.00|3.32|5.77|0.00|-27.35|1.82|1.73|1.75
Pool: 35|-20.27|0.00|5.65|-32.85|0.00|-36.53|-20.40|-19.96|-20.41
Pool: 50|-2.80|0.00|3.73|0.26|0.00|-7.28|-2.83|-2.76|-2.83

### Autocannon: 25 Autocannon connections

Similar to the first scenario, we tested Autocannon with 25 Autocannon connections and four different pool sizes.

||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 10|45.99|546.48|16048.36|7311
Pool: 25|44.35|566.59|15476.04|7050.33
Pool: 35|43.9|571.76|15321.25|6979.67
Pool: 50|41.45|607.92|14466.72|6590.33

For this case, if we compare the results of the base code (the default pool size: 10), we have these results:
||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 25|-3.57%|3.68%|-3.57%|-3.57%
Pool: 35|-4.54%|4.63%|-4.53%|-4.53%|
Pool: 50|-9.87%|11.24%|-9.86%|-9.86%|

For this case, the default pool size had better metrics. And again, we can contrast this with postgres statistics

|Pool Size | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Default: 10|279.28|0.00|15.41|6201.33|5516.73|376.94|177.90|44.65|177.39
Pool: 25|272.59|0.00|17.53|6264.49|6157.64|404.88|175.60|44.21|175.40
Pool: 35|275.45|0.00|17.89|6510.12|6480.80|356.15|172.73|43.54|172.72
Pool: 50|262.38|0.00|17.37|6604.71|5498.47|313.05|163.07|41.00|162.55

Here, we can see the differences between the default pool size and the rest of the pool sizes.
|Pool Size | % commit | % rollback | % disk blocks read | % blocks hit cache | % tuples returned | % tuples fetched | % tuples_inserted | % tuples updated | % tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Pool: 25|-2.40|0.00|13.75|1.02|0.00|7.41|-1.29|-0.99|-1.12
Pool: 35|-1.37|0.00|16.09|4.98|0.00|-5.51|-2.90|-2.49|-2.64
Pool: 50|-6.05|0.00|12.70|6.50|0.00|-16.95|-8.33|-8.17|-8.37

### Autocannon: 50 Autocannon connections

The last case uses 50 Autocannon connections with different pool sizes.

||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 10|48.02|1047.44|16758.56|7634.00
Pool: 25|45.67|1099.82|15938.95|7260.67
Pool: 35|45.85|1094.93|15999.63|7304.33
Pool: 50|45.47|1104.55|15868.14|7244.33

For this case, if we compare the results of the base code (the default pool size: 10), we have these results:
||Request|Latency|Throughput|2xxx
| :--- | ---: | ---: | ---: | ---: |
Pool: 25|-4.89%|5.00%|-4.89%|-4.89%
Pool: 35|-4.52%|4.53%|-4.53%|-4.32%
Pool: 50|-5.32%|5.45%|-5.31%|-5.10%

In a similar way to using a max pool size of 35, with 50 connections a reduction in the main indicators is seen with respect to the base case.

|Pool Size | Avg commit | Avg rollback | Avg disk blocks read | Avg blocks hit cache | Avg tuples returned | Avg tuples fetched | Avg tuples_inserted | Avg tuples updated | Avg tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Default: 10|298.77|0.00|16.48|6052.86|4015.65|429.07|186.90|46.82|185.92
Pool: 25|285.33|0.00|12.40|5925.35|4321.19|383.33|180.46|45.36|180.45
Pool: 35|292.03|0.00|18.95|5568.52|3793.43|408.56|180.60|45.19|179.17
Pool: 50|274.39|0.00|15.10|5248.36|3037.52|410.90|178.28|44.55|176.84

And difference between the default case and the rest of cases.

|Pool Size | % commit | % rollback | % disk blocks read | % blocks hit cache | % tuples returned | % tuples fetched | % tuples_inserted | % tuples updated | % tuples deleted |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
Pool: 25|-4.50|0.00|-24.76|-2.11|0.00|-10.66|-3.45|-3.13|-2.94
Pool: 35|-2.25|0.00|15.00|-8.00|0.00|-4.78|-3.37|-3.48|-3.63
Pool: 50|-8.16|0.00|-8.35|-13.29|0.00|-4.23|-4.61|-4.85|-4.88

### Conclusion

Of the scenarios analyzed, the improvement received occurred when Autocannon used a connection with a max pool size equal to 25.

In the other cases, the increase in the Connection Pool showed worse metrics compared to the base case of the default Pool size (max: 10).

## Method 2: Database changes

As a second step, we are going to run performance tests with bulkload
when the code that creates the indexes as been removed.

As a first step we want to know the performance impact of the creation of the indexes, adding more connections and removing the Share Not Wait. We are going to do this with the bulk load tool.

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

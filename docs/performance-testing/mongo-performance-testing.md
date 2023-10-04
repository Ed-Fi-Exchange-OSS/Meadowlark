# RND-538: MongoDB performance testing

## Goal

50% of Meadowlark's time is spent in the MongoDB driver code as of today, so now
is a good time to start examining MongoDB performance. We have assumptions on how
our indexes should be making our queries perform well, but we should test that.

## Method 1

As a first step we are execute the bulk load tool and the Autocannon tool, once the write lock is removed:
That is removing every reference to Db.writeLockReferencedDocuments().

1. Start mongodb and open search using mongo containers.

2. Start Meadowlark on the host machine with Fastify service.

3. Bulk upload the "partial grand bend" data set, capturing the time taken.

   ```pwsh
   cd ../eng/performance
   .\BulkLoad-Performance.ps1 -Template "PartialGrandBend"
   ```

4. Repeat for a total of 3 measurements with the same settings

5. Comment out any call to Db.writeLockReferencedDocuments().

6. Repeat the measurement process.

7. Repeat the process, but this time use the autocannon tool to measure.
   1. To do this, follow the steps in ./../../Meadowlark-js/tests/profiling/readme.md

### Method 1, AVG Results with the bulk load tool

With the code as it is the average time result is: 04:19:798

With the code with the mentioned function commented out: 02:30:971

### Method 1, AVG Results with autocannon tool

The results can be found here: ./mongo-performance-testing/

### Method 1, Conclusion

The performance improves a lot when we remove that feature from mongo

## Method 2

As a second step, we are going to run performance tests (that is bulk load and Autocannon)
when the code that creates the indexes as been removed. That is on Db.ts, on the mongo backend.

As a first step we want to know the performance impact of the creation of the indexes, that is when we insert the data.
We are going to do this with the bulk load tool.

Based on that, we can then run tests for the reads, with and without indexes. For this step we need to use Autocannon to,
first create a number of schools, and then randomly execute a bunch of reads on those schools.
For this step, I changed the AutocannonSchools.ts script to execute 100000 Gets on those schools previously created.

1. Start mongodb and open search using mongo containers.

2. Start Meadowlark on the host machine with Fastify service.

3. Bulk upload the "partial grand bend" data set, capturing the time taken.

   ```pwsh
   cd ../eng/performance
   .\BulkLoad-Performance.ps1 -Template "PartialGrandBend"
   ```

4. Repeat for a total of 3 measurements with the same settings

5. Comment out, individually, the createIndex calls on Db.ts.

6. Repeat the measurement process.

7. Repeat the process, but this time use the autocannon tool to measure.
   1. To do this, follow the steps in ./../../Meadowlark-js/tests/profiling/readme.md
   2. Measurement is done on inserts and reads.

### Method 2, AVG Results with the bulk load tool

With the code as it is the average time result is: 04:19:798

When I comment out the index creation (one line at a time) the time is 4:06. Meaning that, for each index creation
that I comment out, the performance improves about 5%

### Method 2, AVG Results with the Autocannon tool

This is avg time after 5 times executed.

With the code as it is the average time result is: 01:50:336

When I comment out the index creation for documentUuid: 1:44:711

When I comment out the index creation for outboundRefs: 1:43:527

When I comment out the index creation for aliasMeadowlarkIds: 1:46:556

### Method 2, Conclusion

The performance improves about 5% when I comment out each index creation, individually. But for the reads, the performance
doesn't improve. The reason could be that we don't have enough data in the mongo database.

### Method 3, general review of the memory usage, cpu, connections, etc

The bulk load client runs on the host machine. It has 16 GB of RAM,
Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz   2.59 GHz processor, 6 cores and
12 logical processors, using WSL2. Docker has been configured to use 8GB of RAM
and 10 cores.

Ran bulk load scripts with 8Gb assigned to docker and the time it takes to execute the scripts don't change significantly.

While the script is running:
   In terms of memory, all 3 instances of mongodb use similar amount of memory.
   Mongo1, uses a lot more cpu: about 170%. This is because it is receiving all the write operations.
   Maximum number of connections was 101.
   Maximum amount of memory used by mongo 1 was about 350Mb.
   Maximum number of operations per second, about 1700

Meadowlark:
   Maximum memory usage for the each instance 650Mb. Average is about 450Mb
   Maximum CPU percentage is 140% while average is about 40%.

### Method 4, general review with Mongodb Compass stats while changing the number of connections

For these tests I used Autocannon

1. 5000 requests and 1 connection:
AVG time: 2:44:849
AVG number of operations per second: 187
AVG number of connections: 27

2. 5000 requests and 10 connections:
AVG time: 1:30:880
AVG number of operations per second: 1393
AVG number of connections: 51

3. 5000 requests and 25 connections:
AVG time: 3:17:107
AVG number of operations per second: 1705
AVG number of connections: 91

4. 5000 requests and 50 connections:
AVG time: 4:36:431
AVG number of operations per second: 1857
AVG number of connections: 172

### Method 5, Reviewing Connection pooling

I initially used the bulk load tool, with different connection pooling configurations.

1. maxPoolSize: 100 and minPoolSize: 10:
AVG time: 3:42:418
AVG number of operations per second: 1330
AVG number of connections: 82

2. maxPoolSize: 200 and minPoolSize: 10:
AVG time: 4:09:067
AVG number of operations per second: 1248
AVG number of connections: 82

3. maxPoolSize: 50 and minPoolSize: 10:
AVG time: 3:32:659
AVG number of operations per second: 1543
AVG number of connections: 85

Then I tried with Autocannon tool, to make changes on the number of connections

1. maxPoolSize: 50 and on mongo client minPoolSize: 10. On Autocannon: 5000 requests and 100 connections:
AVG time: 4:54:574
AVG number of operations per second: 2738
AVG number of connections: 289

2. maxPoolSize: 50 and on mongo client minPoolSize: 10. On Autocannon: 5000 requests and 50 connections:
AVG time: 4:37:150
AVG number of operations per second: 1936
AVG number of connections: 148

3. maxPoolSize: 50 and on mongo client minPoolSize: 10. On Autocannon: 5000 requests and 25 connections:
AVG time: 3:06:876
AVG number of operations per second: 1763
AVG number of connections: 95

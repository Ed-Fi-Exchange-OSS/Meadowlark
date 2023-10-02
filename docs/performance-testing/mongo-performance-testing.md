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

# RND-538: MongoDB performance testing

## Goal

50% of Meadowlark's time is spent in the MongoDB driver code as of today, so now
is a good time to start examining MongoDB performance. We have assumptions on how
our indexes should be making our queries perform well, but we should test that.

## Method 1

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

### AVG Results 1

With the code as it is the average time result is: 04:19:798

With the code with the mentioned function commented out: 02:30:971

## Method 2

1. Start mongodb and open search using mongo containers.

2. Start Meadowlark on the host machine with Fastify service.

3. Follow the steps in ./../../Meadowlark-js/tests/profiling/readme.md

4. Repeat for a total of 2 measurements with the same settings

5. Comment out any call to Db.writeLockReferencedDocuments().

6. Repeat the measurement process.

### AVG Results 2

The results can be found here: ./mongo-performance-testing/

# Profiling

To run a profile using Schools:

1. Delete MongoDB meadowlark database if it exists
2. *** Important *** Set FASTIFY_NUM_THREADS=1 environment variable as part of running #3. Clinic crashes on clustered fastify.
3. Run `npm run clinic:flame` from the meadowlark-fastify directory in a terminal to start Meadowlark with the [Clinic.js](https://clinicjs.org/) profiler
4. In a separate terminal, run either:
   - `npx jest tests/profiling/Schools.test.ts` for an automated test that passes if the median latency is below a threshold value.
   - `npx ts-node tests/profiling/AutocannonSchools.ts` to run autocannon directly and get latency and throughput statistics reported to the console. 
5. Once the run completes, hit CTRL-C once in the meadowlark-fastify terminal to stop Meadowlark. Clinic.js
will take over, process its profiling data, and open a web page with the results as a flamegraph. Hitting CTRL-C a second time will cancel Clinic.js processing.
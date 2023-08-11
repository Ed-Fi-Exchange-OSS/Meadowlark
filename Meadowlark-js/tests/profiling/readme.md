# Profiling

To run a profile using Schools:

1. Delete MongoDB meadowlark database if it exists
2. Run `npm run clinic:flame` from the meadowlark-fastify directory in a terminal to start Meadowlark with the [Clinic.js](https://clinicjs.org/) profiler
3. In a separate terminal, run either:
   - `npx jest tests/profiling/Schools.test.ts` for an automated test that passes if the median latency is below a threshhold value.
   - `npx ts-node tests/profiling/AutocannonSchools.ts` to run autocannon directly and get latency and throughput statistics reported to the console. 
4. Once the run completes, hit CTRL-C once in the meadowlark-fastify terminal to stop Meadowlark. Clinic.js
will take over, process its profiling data, and open a web page with the results as a flamegraph. Hitting CTRL-C a second time will cancel Clinic.js processing.
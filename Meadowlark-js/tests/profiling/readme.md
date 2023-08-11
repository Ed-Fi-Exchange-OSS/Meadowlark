# Profiling

To run a profile:

1. Delete MongoDB meadowlark database if it exists
2. Run `npm run clinic:flame` from the meadowlark-fastify directory to start Meadowlark with the [Clinic.js](https://clinicjs.org/) profiler
3. Run the tests/profiling/Schools.test.ts

The test uses [autocannon](https://www.npmjs.com/package/autocannon) to POST Schools for 60 seconds. The test passes if the median latency is below
a threshhold value.

Once the test completes, hit CTRL-C in the meadowlark-fastify terminal to stop Meadowlark. Clinic.js
will take over, process its profiling data, and open a web page with the results as a flamegraph.
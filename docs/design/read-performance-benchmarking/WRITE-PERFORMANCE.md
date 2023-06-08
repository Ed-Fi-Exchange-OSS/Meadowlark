# Write Performance Benchmarking

## Running Write Performance for Meadowlark

There are two ways to analyze write performance for Meadowlark:

1. Bulk Loading.
2. Run Performance Testing.

## Bulk Loading

There are functions to load the GrandBend and PartialGrandBend data sets into Meadowlark, to measure the execution time, run the script [Bulk-LoadPerformance.ps1](../../../eng/performance/BulkLoad-Performance.ps1).

The script receives the parameter for the **Template** that you desire to run (defaults to GrandBend).

This script will enter the data into Meadowlark and will print the total execution time.

## Performance Testing

To do the performance tests to retrieve endpoints, use the
[Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing).

### Setup

- Follow steps to [setup performance suite](./SETUP-PERFORMANCE-SUITE.md).
- TBD

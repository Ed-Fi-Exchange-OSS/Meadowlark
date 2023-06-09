# Write Performance Benchmarking

## Running Write Performance for Meadowlark

There are two ways to analyze write performance for Meadowlark:

1. Bulk Loading.
2. Run Performance Testing.

## Bulk Loading

> **Note**
> To run the bulk loading tests it's important to start with a clean database.

To load the data, there are functions to load the GrandBend and PartialGrandBend data sets into Meadowlark.

To measure the execution time, run the script [Bulk-LoadPerformance.ps1](../../../eng/performance/BulkLoad-Performance.ps1).

The script receives two parameters:

- The **Template** that you desire to run (defaults to GrandBend).
- The **Update** flag specifies if you desire to measure the creation or the update of the resources (defaults to false).

This script will enter the data into Meadowlark and will print the execution time.

## Performance Testing

To do the performance tests to retrieve endpoints, use the
[Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing).

### Setup

- Follow steps to [setup performance suite](./SETUP-PERFORMANCE-SUITE.md).
- TBD

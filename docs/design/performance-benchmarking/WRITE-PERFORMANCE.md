# Write Performance Benchmarking

## Running Write Performance for Meadowlark

There are two ways to analyze write performance for Meadowlark:

1. Bulk Loading
2. Run Performance Testing Suite.

In both cases, Meadowlark and all backend services should be running in containers for
consistency of resource availability and limitations.

## Bulk Loading

> [!NOTE]
> To run the bulk loading tests it's important to start with a clean
> database.

To load the data, there are functions to load the GrandBend and PartialGrandBend
data sets into Meadowlark.

To measure the execution time, run the script
[Bulk-LoadPerformance.ps1](../../../eng/performance/BulkLoad-Performance.ps1).

The script receives two parameters:

- The **Template** that you desire to run (defaults to GrandBend).
- The **Update** flag specifies if you desire to measure the creation or the
  update of the resources (defaults to false).

This script will enter the data into Meadowlark and will print the execution
time.

## Performance Testing Suite

There are two performance test types that paths that cover the write
performance, Pipeclean Tests and Volume Tests.

### Setup

> **Warning**
> _For now_: The tests will be executed with
> [Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing)
> on branch [meadowlark-updates](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing/tree/meadowlark-updates)
> to have the changes required for Meadowlark. Vinaya and/or StephenF can verify when to remove
> this temporary note and use the `main` branch again.

- Follow steps to [setup performance suite](./SETUP-PERFORMANCE-SUITE.md).
- Go to /src/edfi_performance_test folder and run `poetry install`.
- Create a user in meadowlark with the role of `vendor`. Save key and secret.
- Create a .env file based on
  /src/edfi_paging_test/edfi_paging_test/.env.example with your endpoint, and the previously created key
  and secret. Set the values required for Meadowlark.
- Run `poetry run python edfi_performance_test -t "VALUE"` where value can be
  "pipeclean" or "volume". [More details](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing/tree/main/src/edfi-performance-test)

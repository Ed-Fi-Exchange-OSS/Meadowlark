# Read Performance Benchmarking

## Running Read Performance for Meadowlark

To do the performance tests to retrieve endpoints, use the
[Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing).

Meadowlark and all backend services should be running in containers for consistency
of resource availability and limitations.

### Setup

- Follow steps to [setup performance suite](./SETUP-PERFORMANCE-SUITE.md).
- Go to /src/edfi_paging_test folder and run `poetry install`.
- Create a .env file based on /src/edfi_paging_test/edfi_paging_test/.env.example with your endpoint, key and secret.

### Executing a single run of performance tests

- Add the desired endpoints to the .env file or comment line to get all (get all functionality blocked by PERF-294).
- Run `poetry run python edfi_paging_test`
- Verify results located in the specified path or in the /out folder in CSV format.

### Comparing performance of multiple runs

To get a detailed comparison of Mean time and Standard Deviation, run the script
[GetAll-Performance.ps1](../../../eng/performance/GetAll-Performance.ps1).

The script receives two parameters:

**PagingTestsPath**: Path of the Suite3-Performance-Testing edfi-paging-tests location.

**NumTrials**: Number of times to run the tests. Defaults to *5*.

This will print the details of the execution,
additionally, it will generate a report per each run executed in CSV format, that can be analyzed.

Example

```pwsh
.\GetAll-Performance.ps1 -PagingTestsPath c:\Repos\Suite-3-Performance-Testing\src\edfi-paging-test  -NumTrials 10

```

Running this script will print the mean and standard deviation of the executions.

`Mean: 12847.73292`

`Standard Deviation: 2217.78953625164`

To check the CSV results, browse to the performance folders where the results will be saved by execution time.

### Analyzing CSV Performance Results

The execution will generate two CSV files, one with the statistics and another one with the details.

#### Details

Results example:

| Resource |                         URL                         | PageNumber | PageSize | NumberOfRecords | ElapsedTime | StatusCode |
|----------|-----------------------------------------------------|------------|----------|-----------------|-------------|------------|
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  1         |    100   |       100       | 0.020013055 |     200    |
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  2         |    100   |       100       | 0.040413055 |     200    |
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  1         |    100   |       100       | 0.089013055 |     200    |

#### Statistics

Results example:

| Resource | PageSize | NumberOfPages | NumberOfRecords | TotalTime |   MeanTime  | StDeviation | NumberOfErrors |
|----------|----------|---------------|-----------------|-----------|-------------|-------------|----------------|
| accounts |   100    |       2       |         5       |   0.1031  | 0.020013055 |    0.0215   |        0       |
| accounts |   100    |       2       |         5       |   0.1031  | 0.020013055 |    0.0215   |        0       |
| accounts |   100    |       2       |         5       |   0.1031  | 0.020013055 |    0.0215   |        0       |

### Comparing with ODS/API

Run the same tests against and ODS/API instance with the same data set and filtering out the tpdm, sample and homograph
resources since those are not handled by Meadowlark. Changing the url and variables in the .env file inside edfi_paging_test.

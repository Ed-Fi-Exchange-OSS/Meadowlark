# Performance Benchmarking

## Get All

To do the performance tests to retrieve endpoints, use the
[Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing).

### Running Performance tests for Meadowlark

- Configure Meadowlark and verify that it's running.
- Load Sample data with the Invoke-LoadGrandBend or Invoke-LoadPartialGrandBend
  scripts.
- Verify that the data has been loaded correctly through the API or from the
  database.
- Clone the
  [Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing)
  repository.
- Install [python](https://www.python.org/downloads/) and
  [poetry](https://python-poetry.org/docs/#installation).
- Go to /src/edfi_paging_test folder and run `poetry install`.
- Create a .env file based on
  /src/edfi_paging_test/edfi_paging_test/.env.example.
- Add the desired endpoints or comment line to get all (get all functionality
  blocked by RND-XXX).
- Run `poetry run python edfi_paging_test`
- Verify results located in the specified path or in the /out folder in CSV
  format.

### Analyzing Performance Results

The generated csv files display the results of the execution.

Results example:

| Resource |                         URL                         | PageNumber | PageSize | NumberOfRecords |
|----------|-----------------------------------------------------|------------|----------|-----------------|
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  1         |    100   |       100       |
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  2         |    100   |       100       |
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  1         |    100   |       100       |

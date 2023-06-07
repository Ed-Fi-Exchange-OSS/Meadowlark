# Performance Benchmarking

## Get All

To do the performance tests to retrieve endpoints, use the
[Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing).

### Running Performance tests for Meadowlark

- Configure Meadowlark and verify that it's running.
- Load Sample data with the Invoke-LoadGrandBend or Invoke-LoadPartialGrandBend scripts.
- Verify that the data has been loaded correctly through the API or from the database.
- Clone the [Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing) repository.
- Install [python](https://www.python.org/downloads/) and [poetry](https://python-poetry.org/docs/#installation).
- Go to /src/edfi_paging_test folder and run `poetry install`.
- Create a .env file based on /src/edfi_paging_test/edfi_paging_test/.env.example.
- Add the desired endpoints or comment line to get all (get all functionality blocked by RND-577).
- Run `poetry run python edfi_paging_test`
- Verify results located in the specified path or in the /out folder in CSV format.

### Analyzing Performance Results

The generated csv files display the results of the execution.

Results example:

| Resource |                         URL                         | PageNumber | PageSize | NumberOfRecords | ElapsedTime | StatusCode |
|----------|-----------------------------------------------------|------------|----------|-----------------|-------------|------------|
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  1         |    100   |       100       | 0.020013055 |     200    |
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  2         |    100   |       100       | 0.040413055 |     200    |
| accounts | http://{meadowlark_url}/accounts?offset=0&limit=100 |  1         |    100   |       100       | 0.089013055 |     200    |

### Comparing with ODS/API

Run the same tests against and ODS/API instance with the same data set and filtering out the tpdm, sample and homograph
resources since those are not handled by Meadowlark. Changing the url and variables in the .env file inside edfi_paging_test.

### Profiler

<details>
  <summary>Running MongoDB profiler</summary>

MongoDB comes with a built in profiler, disabled by default.

To enable, connect to the docker container with `mongosh` and execute `db.setProfilingLevel(2)` to track all traffic.

This must be done before running the paging tests to track the next instructions. To see the latest tracked data, run `show
profile`.

This will display something similar to:

```json
query   meadowlark.documents 1ms Wed Jun 07 2023 15:20:33
command:{
  find: 'documents',
  filter: {
    aliasIds: {
      '$in': [
        'KcsqHWHlSrAHP0LyDuChFK-C3NuO_tH5NF2YRA',
        'auET2M3A7eg92ChrMaFL6vkmjHtx83fCs3kt_w',
        'h0E08by8zxQHVXAblfHfXX4gU4l2-0AKcLWbGA'
      ]
    }
  },
  projection: { _id: 1 },
  txnNumber: Long("754"),
  autocommit: false,
  '$clusterTime': {
    clusterTime: Timestamp({ t: 1686172829, i: 1 }),
    signature: {
      hash: "",
      keyId: Long("7241292544405929986")
    }
  },
  '$db': 'meadowlark'
} keysExamined:5 docsExamined:2 cursorExhausted numYield:0 nreturned:2 locks:{} storage:{} responseLength:346 protocol:op_msg
```

From the results, you can analyze the timeStamp and the number of docs and keys examined to get the results. [Read more](https://www.mongodb.com/docs/manual/reference/database-profiler/).

</details>

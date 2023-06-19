# Setup Performance Testing Suite

The performance testing suite was developed to support performance tuning of the
ODS/API version 3.0 and newer. The ODS Platform team provides primary support
for the tools in this test suite.

Types of testing that can run with these tools:

- Volume test: 30 minutes of Create, Update, and Delete requests distributed
  across many different resources. Goal: measure throughput.
- Load test: longer run of the volume tests, with a higher number of clients.
  Goal: push to breaking point.
- Soak test: 24 hours of volume tests. Goal: measure throughput over a long
  period of time to detect if there is degradation over time.
- Pipeclean: Execute all API calls once with a single client (“user”), so that I
  know all test cases are functional and system components are running properly.
- Get All Paging: retrieve all records from all (configured) resources.

Steps to run against meadowlark:

- Configure Meadowlark and verify that it's running.
- Load Sample data with the Invoke-LoadGrandBend or Invoke-LoadPartialGrandBend
  scripts (otherwise, the tests will fail without some expected descriptors and
  education organization Ids).
- Verify that the data has been loaded correctly through the API or from the
  database.
- Clone the
  [Suite3-Performance-Testing](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing)
  repository.
- Install [python](https://www.python.org/downloads/) and
  [poetry](https://python-poetry.org/docs/#installation).

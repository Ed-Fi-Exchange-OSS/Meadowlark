# Meadowlark - Running Performance Tests

## Tips

* Run on an isolated environment that does not have anti-virus or other processes running.
* Start with a fresh slate - no records in the databases (both MongoDB and OpenSearch).
* To isolate the performance with MongoDB, disable the OpenSearch listener. This will only be useful with the Bulk Upload tests, because the other tests will try to run "get all" queries that will fail without OpenSearch data.

## Bulk Upload Data

These utilities provide a repeatable, static test of data upload performance, which can be compared against the ODS/API. The tests can be executed using scripts in the `eng directory` in the Meadowlark repository.

* Invoke-LoadGrandBend.ps1 - load the entire Grand Bend dataset, aka "populated template"

    > [!TIP]
    > To load only the descriptors, open that script file and comment out the last line, which writes all of the Grand Bend Data

* `Invoke-LoadPartialGrandBend.ps1` - load a small portion of Grand Bend, including all descriptors and education organizations.

In PowerShell, you can measure the time by wrapping the invocation with `Measure-Command` , as shown below. At the end of the execution, the total time taken will be displayed at the console.

```shell
cd eng/
Measure-Command { ./Invoke-LoadGrandBend.ps1 }
```

## Suite 3 Performance Tests

The [Suite 3 Performance Test](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing) kit includes several test suites that can be useful with Meadowlark.

* Paging Tests run through download of all resources using different page sizes. To be meaningful, you should load the Grand Bend data set. Make sure that the OpenSearch listener is on when running the bulk upload, otherwise OpenSearch will not have any data to return.
* Pipeclean tests run POST, GET, and PUT operations on the API, across all resources.
  * As of 02 Mar 2023 , use branch [PERF-286](https://github.com/Ed-Fi-Exchange-OSS/Suite-3-Performance-Testing/tree/PERF-286) because it has many corrections to allow the suite to work with Meadowlark. ![(warning)](https://edfi.atlassian.net/wiki/s/695013191/6452/be943731e17d7f4a2b01aa3e67b9f29c0529a211/_/images/icons/emoticons/warning.png)

         There are a handful of known errors at this time.
* Volume tests run a heavy load of POST, PUT, and DELETE operations (with a few GET operations), and they log timing information. ![(warning)](https://edfi.atlassian.net/wiki/s/695013191/6452/be943731e17d7f4a2b01aa3e67b9f29c0529a211/_/images/icons/emoticons/warning.png)

     Not yet functional for Meadowlark, likely needs some of the same corrections made in the pipeclean tests.

### Preparing for Suite 3 Tests

* Set environment begin / end years as 1991 to 2050
* Create a Host type key and secret for easy access to all resources, and put those into the test project's `.env`  file.

### Known Problems

As of 02 Mar 2023. This is not a complete list.

```none
PUT     /v3.3b/ed-fi/classPeriods/{id}                          48      HTTPError('400 Client Error: Bad Request for url: /v3.3b/ed-fi/classPeriods/{id}')
PUT http://localhost:3000/local/v3.3b/ed-fi/classPeriods/byQwXeKVqZJuzZSfR8SkjeBN-LLUZekzLIEJQQ - RESPONSE CODE: 400 : {"error":"The identity of the
resource does not match the identity in the updated document."}
```

  The PUT request tried to change the natural key and it was denied. However, \`classPeriod\` is supposed to allow natural key
changes. Should retest this after merging RND-442, which makes some changes in the way that resources are matched.

Similar: gradeBookEntry

* * *

```none
POST    /v3.3b/ed-fi/educationContents                          58      HTTPError('400 Client Error: Bad Request for url: /v3.3b/ed-fi/educationContents')
POST http://localhost:3000/local/v3.3b/ed-fi/educationContents - RESPONSE CODE: 400 : {"error":[{"message":"{requestBody} must have required property 'learningResourceMetadataURI'","path":"{requestBody}","context":{"errorType":"required"}},{"message":"{requestBody} must have required property 'shortDescription'","path":"{requestBody}","context":{"errorType":"required"}},{"message":"{requestBody} must have required property 'contentClassDescriptor'","path":"{requestBody}","context":{"errorType":"required"}}]}
```

\`learningResourceMetadataURI\` *should* be required, according to the model. The ODS/API is not requiring it, and the MetaEd language definition makes it questionable what we should do with it. I have proposed changing MetaEd to reflect the "not required" state. Also requires \`contentClassDescriptor\` and  \`shortDescription\`.

* * *

Descriptor \`codeValue\` can be updated in ODS/API and it cascades. We need to standardize that.

* * *

```none
POST    /v3.3b/ed-fi/reportCards                                34      HTTPError('400 Client Error: Bad Request for url: /v3.3b/ed-fi/reportCards')
POST http://localhost:3000/local/v3.3b/ed-fi/reportCards - RESPONSE CODE: 400 : {"error":[{"message":"'gpaGivenGradingPeriod' property is not expected to be here","suggestion":"Did you mean property 'gPAGivenGradingPeriod'?","path":"{requestBody}","context":{"errorType":"additionalProperties"}}]}
```

Same as the known iEP problem

* * *

```none
GET     /v3.3b/ed-fi/schoolYearTypes                            10      HTTPError('404 Client Error: Not Found for url: /v3.3b/ed-fi/schoolYearTypes')
GET http://localhost:3000/local/v3.3b/ed-fi/schoolYearTypes - RESPONSE CODE: 404 : {"error":"Invalid resource 'schoolYearTypes'. The most similar resource is 'schoolTypeDescriptors'."}
```

We didn't implement \`schoolYearTypes\` as an endpoint because it isn't in the Data Standard... but it \_is\_ in the API specification. So we \_should\_ implement it, reading from the environment variables

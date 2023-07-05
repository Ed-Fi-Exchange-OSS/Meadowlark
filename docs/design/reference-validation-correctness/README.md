# Reference Validation Correctness

When checking for correctness on Meadowlark data we want to prioritize two
areas:

1. Dangling references.
2. Data results comparison.

In order to check for validation correctness, we need to create data in bulk for
analysis.

## Run Volume Testing

Follow steps defined in
[WRITE-PERFORMANCE](../performance-benchmarking/WRITE-PERFORMANCE.md) to write
data into the database.

## Check for dangling references

Tickets for pending work:

- Script to Delete resources [RND-592](https://tracker.ed-fi.org/browse/RND-592)
- Create script to check for dangling resources in MongoDB
  [RND-544](https://tracker.ed-fi.org/browse/RND-544)
- Create script to check for dangling resources in PostgreSQL
  [RND-545](https://tracker.ed-fi.org/browse/RND-545)

## Compare data types

Execute the same API calls for both Meadowlark and ODS/API to compare data types from the results.

To review this scenario, create resource that contain **strings**, **dates** and **numbers** and compare with the same response from ODS / API.

### Example

GET AcademicWeeks response

#### Meadowlark

```json
  {
    "id": "71465714b4cb465ba27136338af5ed7e",
    "schoolReference": {
      "schoolId": 100
    },
    "weekIdentifier": "uh9z473jh088w5a0fzdnw46qsifptmc4",
    "beginDate": "2023-08-07",
    "endDate": "2023-08-13",
    "totalInstructionalDays": 5,
  }
```

#### ODS / API

```json
  {
    "id": "71465714b4cb465ba27136338af5ed7e",
    "schoolReference": {
      "schoolId": 100,
      "link": {
        "rel": "School",
        "href": "/ed-fi/schools/1c7b90ffc158418f8adb757aa3b7a9a6"
      }
    },
    "weekIdentifier": "uh9z473jh088w5a0fzdnw46qsifptmc4",
    "beginDate": "2023-08-07",
    "endDate": "2023-08-13",
    "totalInstructionalDays": 5,
    "_etag": "5249922557844181283"
  }
```

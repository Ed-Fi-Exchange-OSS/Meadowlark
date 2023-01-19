# Opensearch Backend for Meadowlark

:exclamation: This solution should only be used on localhost with proper firewalls around
external network access to the workstation. Not appropriate for production use.

This Docker Compose file provisions a single node of the OpenSearch search
engine and [OpenSearch Dashboard](http://localhost:5601/) (latest versions).

## Visualizations in OpenSearch Dashboards

Once data starts flowing into OpenSearch, you can setup some basic
visualizations with the OpenSearch Dashboards. Basic steps:

1. Open [Create an Index
   Pattern](http://localhost:5601/app/management/opensearch-dashboards/indexPatterns/create)
   1. Step 1: use index pattern `type$ed-fi*`
   2. Step 2: for time field, select "I don't want to use the filter at this time"
   3. Click the "Create Index" button.
2. In the Tools menu click on Visualize, then click the "create new
   visualization" button.
3. Example: choose type `metric` and click through. Now
   you have a count of the records in OpenSearch.
   * Tip: above the metric display you'll find "+ Add Filter". Use this if you
     want to filter on a particular entity type, such as `studentUniqueId:
     exists`.

## Clearing Out All Data

Run the following commands from the Dev Tools console.

Delete all documents:

```none
POST */_delete_by_query
{
  "query": {
    "match_all": {}
  }
}
```

Delete all indices:

```none
DELETE *
```

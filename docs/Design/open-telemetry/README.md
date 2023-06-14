# What is Open Telemetry?

[OpenTelemetry](https://opentelemetry.io/), also known as OTel, is an
open-source framework for generating, collecting, and exporting telemetry data
such as traces, metrics, and logs in a standardized way.

## What can OpenTelemetry do for me?

OTel has broad industry support and adoption from cloud providers, vendors and
end users. It provides you with:

- A single, vendor-agnostic instrumentation library per language with support
  for both automatic and manual instrumentation.
- A single vendor-neutral collector binary that can be deployed in a variety of
  ways.
- An end-to-end implementation to generate, emit, collect, process and export
  telemetry data.
- Full control of your data with the ability to send data to multiple
  destinations in parallel through configuration.

## What Open Telemetry is not

OTel is not an observability back-end (data store). It does however support a
number of existing observability back-ends such as
[Jaeger](https://www.jaegertracing.io/) and [Prometheus](https://prometheus.io/)

## What Drives OTel

### Tracing

Tracing gives the overall big picture of what is happening by showing the path a
request takes through the system. In OTel a trace is a collection of one or more
spans.

[Spans](https://opentelemetry.io/docs/concepts/observability-primer/#spans)
represent a unit of work, tracking the specific operation that a request made
within the system. Spans can have a parent/child relationship, and can be linked
in a more casual relationship. Spans also contain span events, which act as
structured log messages within OTel.

### Metrics

A metric is a measurement about a service captured at runtime. Metrics can
contain raw measurement data or aggregate the raw data through the use of
instruments.  OTel defines six metric instruments all of which have a default
aggregation method that can be overridden. The metric instruments provided by
OTel include:

- Counters of various flavors (increment only, increment/decrement, and
  asynchronous - where only the aggregated final value is reported)
- Gauge - A measurement of the current value at the time it's read
- Histogram

Metrics can be correlated with traces, but do not need to be.

### Logs

A log is any text sent to OTel that is not a part of a trace or metric. Span
events discussed in tracing above are considered a type of log, but since
SpanEvents are tied to spans, which are then tied to traces, they fall into
tracing. It's generally recommended that logging data become part of trace
through a SpanEvent.

## Manual vs. Automatic Instrumentation

Manual instrumentation is as the name describes, is manual. It is the process of
implementing OTel into the system using SDK's directly. With manual
instrumentation, you get full control of what is happening but it will be more
complex and time consuming to get everything in place. OTel does provide SDK's
for JavaScript with Typescript bindings.

OTel also offers automatic instrumentation, which can hook into existing
libraries providing basic instrumentation with just a few lines of code. To test
this out, I added the following code to the initialize function of the
Meadowlark-core frontendFacade

```JavaScript
  const sdk = new NodeSDK({
    traceExporter: new ConsoleSpanExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
```

and with a call to POST a student to the Meadowlark API, we get the following
back in the traces:

```JavaScript
{
  traceId: 'c165a7a72532438262039f0ca57e57c4',
  parentId: '2cb405fe86791bf0',
  traceState: undefined,
  name: 'PUT',
  id: '5dabc5f64a017428',
  kind: 2,
  timestamp: 1683667015049000,
  duration: 439410,
  attributes: {
    'http.url': 'http://localhost:9200/ed-fi%243-3-1-b%24student/_doc/bd4acc3c-af8d-4da3-88ea-e232d3068427?refresh=true',
    'http.method': 'PUT',
    'http.target': '/ed-fi%243-3-1-b%24student/_doc/bd4acc3c-af8d-4da3-88ea-e232d3068427?refresh=true',
    'net.peer.name': 'localhost',
    'http.host': 'localhost:9200',
    'http.user_agent': 'opensearch-js/2.1.0 (win32 10.0.19045-x64; Node.js v16.14.0)',
    'net.peer.ip': '127.0.0.1',
    'net.peer.port': 9200,
    'http.response_content_length_uncompressed': 229,
    'http.status_code': 201,
    'http.status_text': 'CREATED',
    'http.flavor': '1.1',
    'net.transport': 'ip_tcp'
  },
  status: { code: 0 },
  events: [],
  links: []
}
{
  traceId: 'c165a7a72532438262039f0ca57e57c4',
  parentId: undefined,
  traceState: undefined,
  name: 'POST',
  id: '2cb405fe86791bf0',
  kind: 1,
  timestamp: 1683667014784000,
  duration: 707563,
  attributes: {
    'http.url': 'http://localhost:3000/local/v3.3b/ed-fi/students/',
    'http.host': 'localhost:3000',
    'net.host.name': 'localhost',
    'http.method': 'POST',
    'http.scheme': 'http',
    'http.target': '/local/v3.3b/ed-fi/students/',
    'http.user_agent': 'vscode-restclient',
    'http.request_content_length_uncompressed': 204,
    'http.flavor': '1.1',
    'net.transport': 'ip_tcp',
    'net.host.ip': '127.0.0.1',
    'net.host.port': 3000,
    'net.peer.ip': '127.0.0.1',
    'net.peer.port': 57641,
    'http.status_code': 201,
    'http.status_text': 'CREATED'
  },
  status: { code: 0 },
  events: [],
  links: []
}

```

The first trace coming from the POST to the students endpoint to create a
student. The second trace is the call adding the new student to Opensearch

The above trace shows us what Node knows about what happened with Meadowlark.
Which is that a POST request to the students endpoint was made, a resource was
created, and a PUT call made to OpenSearch, which also resulted in a 201.

It is possible to add attributes to traces by retrieving the current trace and
adding new attributes through the OTel SDK.

OTel has an extensive [collection of
plugins](https://opentelemetry.io/ecosystem/registry/?language=js&component=instrumentation)
to auto instrument JavaScript packages, including a number of packages that are
used in Meadowlark including Fastify, MongoDB and PostgeSQL.

## OTel Collector

There are a couple of ways to handle trace data after it's been created. One way
is to directly send telemetry data to a backend such as Prometheus, Jager or
ElasticSearch from Meadowlark.

OTel also provides the Collector. The Collector offers a vendor-agnostic
implementation of how to receive, process and export telemetry data.

Pros of using a collector:

- Easy to set up (docker container available)
- Can be run as a cluster
- Duplicate telemetry data from the collector to multiple endpoints
- Collects from multiple services before moving to telemetry backend
  - Process the data (adding/removing attributes, handling batching, etc.)
    before sending it to another destination
- Decouple the producer with the consumer

Due to the flexibility of how the collector can be set up and the control it
gives to it's users, collectors are the suggested way to handle OTel output.

## Cloud Provider Support

Since the OTel Collector and popular backends are containerized, OTel can be
used with the top three cloud providers. The following details how the big three
integrate with OTel:

### Amazon Web Services

AWS has quite possibly the best built in support as of the creation of this
document. AWS provides the 'AWS Distro' for Open Telemetry, which includes:

- An AWS specific version of the OTel SDK - Allowing for the collection of AWS
  related resources into your OTel setup
- OTel Collector Integrates seamlessly into Amazon CloudWatch as the backend
data store for OTel, allowing the collection of all AWS logging into a single
location. (Cloudwatch is optional, other OTel backends can be used as well)

### Microsoft Azure

Microsoft plans to go all in and support OTel, but they are still building out
the internal support for OTel. Microsoft released the Azure Monitor
OpenTelemetry Distro at the end of May. This will allow OTel data to flow into
Application Insights but it does require a package to be included and called
within Meadowlark code. Without code changes it looks like a different backend
would need to be chosen for Azure.

### Google Cloud Platform

GCP, like AWS has it's own collector, the OpenTelemetry Operations Collector
that will send OTel data directly to GCP's Cloud Trace and Cloud Monitoring
Metrics

## How Meadowlark could use Open Telemetry

Since we already have a form of tracing within Meadowlark through our existing
logs, it doesn't seem like it would be all that difficult to add OTel tracing to
Meadowlark, although managing parent/child traces may be a bit of work to do
properly.

First auto instrument:

- NodeJS
- MongoDB
- PostgreSQL

We could also include Fastify but it's unclear if there is value as it's not
really a primary piece of Meadowlark.

Auto instrumentation would give us a baseline to start from. Next step would be
to update our logging to use OTel tracing.

The logger would:

- Retrieve the current active trace
  - This will generally be a trace created by one of the auto instrumented
    packages
- For every new Meadowlark file the we execute code in, a logging event will
  cause the creation of a new span
- Logging events in the file would add a new event to the span for the file

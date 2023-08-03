# Ed-Fi Transformations for Apache Kafka® Connect

[Single Message Transformations
(SMTs)](https://kafka.apache.org/documentation/#connect_transforms) for Apache
Kafka Connect.

## Transformations

See [the Kafka
documentation](https://kafka.apache.org/documentation/#connect_transforms) for
more details about configuring transformations on how to install transforms.

### `GenerateIndexFromResource`

This transformation builds an index based on a group of values contained in the
body of the result, separated by $.

- `com.github.edfiexchangeoss.meadowlark.kafka.connect.transforms.GenerateIndexFromResource$Value`
  - works on values.

The transformation defines the following configurations:

- `field.name` - Comma separated list of fields to be included into building the
  Index. This fields will be separated by $ and will add `descriptor` at the end
  if resource is marked as such.

Here is an example of this transformation configuration:

```properties
transforms=GenerateIndexFromResource
transforms.GenerateIndexFromResource.type=com.github.edfiexchangeoss.meadowlark.kafka.connect.transforms.GenerateIndexFromResource
transforms.GenerateIndexFromResource.field.name=projectName,resourceVersion,resourceName
```

## Running transformations

This project includes a series of *gradle* tasks:

- `./gradlew build`: Compile code

- `./gradlew test`: Run unit tests

- `./gradlew installDist`: Creates a jar distributable file, located under
  `/build/install/ed-fi-kafka-connect-transforms/ed-fi-kafka-connect-transforms-{version}.jar`

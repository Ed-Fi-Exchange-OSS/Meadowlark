# Meadowlark MongoDB Container

This images was created to support loading [Ed-Fi
Meadowlark](https://github.com/Ed-Fi-Exchange-OSS/Meadowlark) deployments using
MongoDB 4.0.28 with a three node cluster and appropriate security. Anyone
wishing for more nodes can easily tweak the initialization script or simply
reconfigure replication after initialization.

In a local development environment, the initialization script can be copied into
a container quite easily. Running on a cloud platform this can be more
challenging. Hence, having a prepared image is intended to smooth the way to
cloud deployment.

The new image created with this Dockerfile can be used for every node in
a replica set. However, there is a special "one-time setup" script that should
only be executed by one node in a replica set. As a hack, the script looks at
the hostname: if it is "mongo1" then it runs the setup procedure, and otherwise
exits.

## Notices

The base MongoDB image is published under the [Affero GNU Public
License](https://github.com/mongodb/mongo/blob/6ea81c883e7297be99884185c908c7ece385caf8/README#L89-L95)
(AGPL) agreement.

No changes have been made to the MongoDB source code with this image. The
additional initialization script is available under the terms of the Apache
License, version 2.0.

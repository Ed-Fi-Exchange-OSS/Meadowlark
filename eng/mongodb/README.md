# Specialized MongoDB Containers

These images were created to support loading Meadowlark into Azure Container
Instances (ACI). The `cp` command is not enabled for ACI communication - so it
is not possible to copy a file into a running container, which is the technique
used in the initial setup instructions for localhost development.

As an alternative, this directory contains a specialized Dockerfile and init
script. The new image created with this Dockerfile can be used for every node in
a replica set. However, there is a special "one-time setup" script that should
only be executed by one node in a replica set. As a hack, the script looks at
the hostname: if it is "mongo1" then it runs the setup procedure, and otherwise
exits.

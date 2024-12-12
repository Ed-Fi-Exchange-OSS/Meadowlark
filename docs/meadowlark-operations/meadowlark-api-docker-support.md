# Meadowlark API Docker Support

## Docker Image

With help from the [snyk blog](https://snyk.io/blog/choosing-the-best-node-js-docker-image/),  the team has selected the Debian bullseye "slim" base image to optimize size and security of the image. From there, the Dockerfile install minimal build tools, copies the source code into the the image, and runs a build directly inside the image. Then it creates a final layer that is based on the original layer, and thus does not have the build tools.

## Docker Compose for Local Testing

For local testing, the source code repository contains a docker-compose file that will start up and connect all images required to run a complete MongoDB-based "deploy" of Meadowlark. This is not recommended for production use, as it is not properly secured with HTTPS and does not have a reverse-proxy to protect the Node.js-based API.

For more information on this solution, see the DOCKER.md file in the repository.

## Cloud-Based Hosting

As of 02 Feb 2023, the development team has not yet done any work to try to run the Docker image on a cloud provider. Rough notes of the way forward:

* Not at present building the image on Docker Hub. We might add this in the future. Anyone wanting to use it is advised to create the Meadowlark image directly in the cloud provider's Container Registry.
* The Meadowlark API uses Node.js for serving HTTP content. In a production scenario - which means, ultimately, in *all* environments, since they should have the same topology - this Node.js service should be sitting behind a reverse proxy / gateway. Details depend on the installation. Many installations will choose to use the cloud provider's load balancing solution for external access to the API, and for HTTPS termination. In some cases it may also be appropriate to have a reverse proxy *inside the container network* so that the Node.js port is not directly exposed to the outside world. These are implementation and security details that the Alliance development team can discuss, but they do not have the expertise to provide the best advice.
* Any implementation will need to decide whether or not to use managed services for the database backends, or whether to host them directly in the container ecosystem. There will be cost and management implications either way, and again this is beyond the development team's expertise.

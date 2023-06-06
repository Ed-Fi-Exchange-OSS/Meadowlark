FROM opensearchproject/opensearch:2.7.0@sha256:55f1f67e7d3645aa838b63a589bce5645154ba275814e52d4638d371ca0f8cb5

ENV cluster.name="opensearch-cluster-ml-local"
ENV bootstrap.memory_lock="true"
ENV discovery.type="single-node"

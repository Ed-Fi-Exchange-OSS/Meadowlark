FROM opensearchproject/opensearch:2.5.0@sha256:f077efb452be64d3df56d74fe99fd63244704896edf6ead73a0f5decb95a40bf

ENV cluster.name="opensearch-cluster-ml-local"
ENV bootstrap.memory_lock="true"
ENV discovery.type="single-node"

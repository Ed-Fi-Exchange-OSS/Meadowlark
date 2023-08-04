# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

FROM gradle:8.2.1-jdk-focal@sha256:78b95c865c1bcb50ced01501e6a9c6c9bcc181be93c1ea723ff4b58b2f7e9a96 AS build
COPY --chown=gradle:gradle /ed-fi-kafka-connect-transforms /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle installDist --no-daemon

FROM debezium/connect:2.3@sha256:dfa59c008a03f45c7b286d2874f2e6dbe04f3db6f26b6f01806c136abb07381a
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"

ARG package=opensearch-connector-for-apache-kafka-3.1.0.tar

ADD --chown=kafka --chmod=600 https://github.com/aiven/opensearch-connector-for-apache-kafka/releases/download/v3.1.0/${package} \
    /kafka/connect/

RUN cd /kafka/connect/ && \
    originalSha=58c27bdb0b8883e2e3291a2aaa42151b77240a33d3361ad620c656e775da14d2 && \
    newSha=$(sha256sum ${package} | awk '{print $1}') && \
    if [ $originalSha != $newSha ]; then exit 1; fi

RUN cd /kafka/connect/ && \
    tar -xvf ${package} && \
    rm ${package}

COPY --from=build /home/gradle/src/build/libs /kafka/connect/ed-fi-kafka-connect-transforms

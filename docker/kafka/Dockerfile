# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

FROM debezium/connect:2.4@sha256:a09485cadade2b349f9b500b71098de6c9fe31e3281aa2ff2b30323960ce6332
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"

ADD --chown=kafka --chmod=600 https://github.com/aiven/opensearch-connector-for-apache-kafka/releases/download/v3.1.0/opensearch-connector-for-apache-kafka-3.1.0.tar \
    /kafka/connect/

RUN cd /kafka/connect/ && \
    tar -xvf opensearch-connector-for-apache-kafka-3.1.0.tar && \
    rm opensearch-connector-for-apache-kafka-3.1.0.tar


# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

FROM amazon/opendistro-for-elasticsearch-kibana:1.4.0
RUN /usr/share/kibana/bin/kibana-plugin remove opendistro_security
COPY --chown=kibana:kibana kibana.yml /usr/share/kibana/config/
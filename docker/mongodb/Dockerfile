# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

FROM mongo:4.0.28@sha256:f68f07e0c0ee86b1d848a30b27e5573e9c960748a02f7c288e28282297117644
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"

COPY --chmod=+x initialize-cluster.sh /usr/local/bin/initialize-cluster.sh
COPY --chmod=+x mongo-key-file-setup.sh /usr/local/bin/mongo-key-file-setup.sh
COPY --chmod=+x start.sh /usr/local/bin/start.sh
COPY --chmod=+x start-node1.sh /usr/local/bin/start-node1.sh

CMD [ "mongod" ]

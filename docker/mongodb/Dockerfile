# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

FROM mongo:6.0@sha256:f462722e606fe097ad00c0d39f97680ee050b90df43e1484543c2a31cb61b039
LABEL maintainer="Ed-Fi Alliance, LLC and Contributors <techsupport@ed-fi.org>"

COPY --chmod=+x initialize-cluster.sh /usr/local/bin/initialize-cluster.sh
COPY --chmod=+x mongo-key-file-setup.sh /usr/local/bin/mongo-key-file-setup.sh
COPY --chmod=+x start.sh /usr/local/bin/start.sh
COPY --chmod=+x start-node1.sh /usr/local/bin/start-node1.sh

CMD [ "mongod" ]

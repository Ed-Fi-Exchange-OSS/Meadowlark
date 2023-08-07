# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

FROM edfialliance/ods-api-web-api:v2.1.5@sha256:2e6c04b1821f3584a58a993d65b62105b62a0323a4c99acbf1ee70f88f433c10
COPY appsettings.template.json /app/appsettings.template.json

ENTRYPOINT ["/app/run.sh"]

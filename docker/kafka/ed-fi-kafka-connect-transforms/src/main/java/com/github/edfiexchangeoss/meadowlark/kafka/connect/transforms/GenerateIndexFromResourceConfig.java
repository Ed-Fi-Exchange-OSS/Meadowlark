/*
 * Copyright 2019 Aiven Oy
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 *  SPDX-License-Identifier: Apache-2.0
 *  Licensed to the Ed-Fi Alliance under one or more agreements.
 *  The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
 *  See the LICENSE and NOTICES files in the project root for more information.
 */


package com.github.edfiexchangeoss.meadowlark.kafka.connect.transforms;

import java.util.Map;
import java.util.Optional;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;

class GenerateIndexFromResourceConfig extends AbstractConfig {
    public static final String FIELD_NAME_CONFIG = "field.name";
    private static final String FIELD_NAME_DOC =
        "The list of properties separated by comma which should be used as the topic name. ";

    GenerateIndexFromResourceConfig(final Map<?, ?> originals) {
        super(config(), originals);
    }

    static ConfigDef config() {
        return new ConfigDef()
            .define(
                FIELD_NAME_CONFIG,
                ConfigDef.Type.STRING,
                null,
                ConfigDef.Importance.HIGH,
                FIELD_NAME_DOC);
    }

    Optional<String> fieldName() {
        final String rawFieldName = getString(FIELD_NAME_CONFIG);
        if (null == rawFieldName || "".equals(rawFieldName)) {
            return Optional.empty();
        }
        return Optional.of(rawFieldName);
    }
}

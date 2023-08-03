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

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GenerateIndexFromResourceConfigTest {

    @Test
    void emptyFieldName() {
        final Map<String, String> props = new HashMap<>();
        props.put("field.name", "");
        final GenerateIndexFromResourceConfig config = new GenerateIndexFromResourceConfig(props);
        assertThat(config.fieldName()).isNotPresent();
    }

    @Test
    void definedFieldName() {
        final Map<String, String> props = new HashMap<>();
        props.put("field.name", "test");
        final GenerateIndexFromResourceConfig config = new GenerateIndexFromResourceConfig(props);
        assertThat(config.fieldName()).hasValue("test");
    }
}

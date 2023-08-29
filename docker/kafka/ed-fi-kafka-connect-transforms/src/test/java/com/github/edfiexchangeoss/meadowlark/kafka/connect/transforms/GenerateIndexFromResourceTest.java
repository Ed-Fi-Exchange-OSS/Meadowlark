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
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.kafka.common.record.TimestampType;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.errors.DataException;
import org.apache.kafka.connect.sink.SinkRecord;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GenerateIndexFromResourceTest {

    private static final String FIELD = "test_field";
    private static final String NEW_TOPIC = "new_topic";

    @Test
    void nullSchema() {
        final SinkRecord originalRecord = record(null);
        assertThatThrownBy(() -> transformation(FIELD).apply(originalRecord))
                .isInstanceOf(DataException.class)
                .hasMessage("value can't be null: " + originalRecord);
    }

    @Test
    void generateIndex_UnsupportedValueType() {
        final SinkRecord originalRecord = record(new HashMap<String, Object>());
        assertThatThrownBy(() -> transformation(null).apply(originalRecord))
                .isInstanceOf(DataException.class)
                .hasMessage("value must specify one or more field names comma separated.");
    }

    @Test
    void generateIndex_NonObject() {
        final SinkRecord originalRecord = record("some");
        assertThatThrownBy(() -> transformation(FIELD).apply(originalRecord))
                .isInstanceOf(DataException.class)
                .hasMessage("value type must be an object: " + originalRecord);
    }

    @Test
    void generateIndex_NullStruct() {
        final SinkRecord originalRecord = record(null);
        assertThatThrownBy(() -> transformation(FIELD).apply(originalRecord))
                .isInstanceOf(DataException.class)
                .hasMessage("value can't be null: " + originalRecord);
    }

    @Test
    void generateIndex_NotReceivingExpectedObject() {
        final var field = Map.of(FIELD, Map.of());
        final SinkRecord originalRecord = record(field);
        assertThatThrownBy(() -> transformation(FIELD).apply(originalRecord))
                .isInstanceOf(DataException.class)
                .hasMessage(FIELD + " type in value "
                        + field + " must be a comma separated string: " + originalRecord);
    }

    @ParameterizedTest
    @ValueSource(strings = "missing")
    @NullAndEmptySource
    void generateIndex_ReceivingObject_NullOrEmptyValue(final String value) {
        final Map<String, Object> valueMap = new HashMap<>();
        valueMap.put("another", "value");
        if (!"missing".equals(value)) {
            valueMap.put(FIELD, value);
        }
        final SinkRecord originalRecord = record(valueMap);
        assertThatThrownBy(() -> transformation(FIELD).apply(originalRecord))
                .isInstanceOf(DataException.class)
                .hasMessage(FIELD + " in value can't be null or empty: " + originalRecord);
    }

    @Test
    void generateIndex_ReceivingObject_NormalStringValue() {
        final SinkRecord originalRecord;
        final var receivedObject = Map.of(FIELD, NEW_TOPIC);
        originalRecord = record(receivedObject);
        final SinkRecord result = transformation(FIELD).apply(originalRecord);
        assertThat(result).isEqualTo(setNewTopic(originalRecord, NEW_TOPIC));
    }

    @ParameterizedTest
    @ValueSource(strings = { "true", "false" })
    void generateIndex_ReceivingObject_WithCommaSeparatedList(final String isDescriptor) {
        final SinkRecord originalRecord;
        final var project = "project";
        final var resourceVersion = "resourceVersion";
        final var resourceVersionValue = "major.minor.patch";
        final var resourceName = "resourceName";
        final var resourceNameValue = "resourceName" + (isDescriptor.equals("true") ? "descriptor" : "");
        final Map<String, String> receivedObject = Stream.of(new String[][] {
                {"project", project},
                {"resourceVersion", resourceVersionValue},
                {"resourceName", resourceNameValue},
                {"additionalData", "additionalData"},
                {"isDescriptor", isDescriptor},
        }).collect(Collectors.toMap(data -> data[0], data -> data[1]));

        originalRecord = record(receivedObject);
        final var expectedResult = (project + "$" + resourceVersionValue + "$" + resourceNameValue).replace(".", "-");

        final var params = project + "," + resourceVersion + "," + resourceName;
        final SinkRecord result = transformation(params).apply(originalRecord);
        assertThat(result).isEqualTo(setNewTopic(originalRecord, expectedResult));
    }

    private GenerateIndexFromResource<SinkRecord> transformation(final String fieldName) {

        final Map<String, String> props = new HashMap<>();
        if (fieldName != null) {
            props.put("field.name", fieldName);
        }
        final GenerateIndexFromResource<SinkRecord> transform = createTransformationObject();
        transform.configure(props);
        return transform;
    }

    protected GenerateIndexFromResource<SinkRecord> createTransformationObject() {
        return new GenerateIndexFromResource<>();
    }

    protected SinkRecord record(final Object data) {
        return record(null, null, null, data);
    }

    protected SinkRecord record(final Schema keySchema,
            final Object key,
            final Schema valueSchema,
            final Object value) {
        return new SinkRecord("original_topic", 0,
                keySchema, key,
                valueSchema, value,
                123L,
                456L, TimestampType.CREATE_TIME);
    }

    private SinkRecord setNewTopic(final SinkRecord record, final String newTopic) {
        return record.newRecord(newTopic,
                record.kafkaPartition(),
                record.keySchema(),
                record.key(),
                record.valueSchema(),
                record.value(),
                record.timestamp(),
                record.headers());
    }
}
